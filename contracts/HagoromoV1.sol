// SPDX-License-Identifier: UNLICENSED 

pragma solidity >=0.6.2 <0.8.0;
pragma experimental ABIEncoderV2; 

import "./utils/Address.sol";
import "./utils/SafeMath.sol";
import "./access/Ownable.sol";
import "./interfaces/IERC20.sol";

contract HagoromoV1 is Ownable {
    using Address for address;
    using SafeMath for uint;

    // events
    event _ProposalInitialized(bytes32 description, uint endDate, uint requiredFund, uint propNonce, address indexed creator);
    event _FundingRightsGranted(uint numTokens, address indexed fundRaiser);
    event _FundingRightsWithdrawn(uint numTokens, address indexed fundRaiser);
    event _FundRaising(uint propNonce, uint numTokens, address indexed fundRaiser);
    event _TokensWithdrawn(uint propNonce, address indexed creator);
    event _TokensRescued(uint propNonce, address indexed fundRaiser);

    // storage
    struct proposal {
        bytes32 description; // short description (up to 32 bytes)
        bytes32 url; // url for the project (up to 32 bytes)
        address beneficiary; // beneficiary address who creates a proposal
        uint endDate; // expiration date of the proposal
        uint raisedFund; // the total raised funds
        uint requiredFund; // target amount of this proposal
        bool status; // status if the requiredFund is pass
        bool transferred; // if raisedFund was transferred
    }

    // declares variables
    uint constant private INITIAL_PROPOSAL_NONCE = 0; // initial proposal nonce number
    uint private propNonce; // increasing proposal nonce number

    mapping(uint => proposal) private _propMap; // maps propNonce to proposal struct
    mapping(address => uint) private _propTokenBalance; // maps user's address to tokenBalance
    mapping(uint => mapping(address => uint)) private _pendingFunds; // maps pending Funds

    IERC20 public token; // we use JPYC for Hagoromo application as of now

    /**
     * @notice Initializer. This can only be called once.
     * @param _token The address where the ERC20 token contract is deployed.
     */
    function init(address _token) external onlyOwner { // this function can be a constructor??
        require(_token != address(0) && address(token) == address(0), "This contract address is prohibited to use");
        token = IERC20(_token);
        propNonce = INITIAL_PROPOSAL_NONCE;
    }

    // getter functions
    function pendingFund(uint _propNonce) external view returns (uint) {
        return _pendingFunds[_propNonce][msg.sender];
    }

    function tokenBalance() external view returns (uint) {
        return _propTokenBalance[msg.sender];
    }

    function getProposal(uint _propNonce) external view returns(
        bytes32,
        bytes32,
        uint,
        uint,
        uint,
        bool,
        bool)
    {
        proposal storage p = _propMap[_propNonce];
        return (
            p.description,
            p.url,
            p.endDate,
            p.raisedFund,
            p.requiredFund,
            p.status,
            p.transferred
        );
    }

    function getPropNonce() external view returns (uint) {
        return propNonce;
    }

    // token interface
    /**
     * @notice TransferFrom _numTokens ERC20 tokens to the app contract, granting funds
     * @dev Assumes that msg.sender has approved the app contract to spend on their behalf
     * @param _numTokens The number of funds tokens desired in exchange for ERC20 tokens
     */
    function requestFundingRights(uint _numTokens) external returns (bool) {
        require(token.balanceOf(msg.sender) >= _numTokens, "Cannnot fund more than you have");
        _propTokenBalance[msg.sender] = _propTokenBalance[msg.sender].add(_numTokens);

        // Transfer tokens to the app contract
        // A user must approve tokens to the contract in advance token.approve
        require(token.transferFrom(msg.sender, address(this), _numTokens));
        emit _FundingRightsGranted(_numTokens, msg.sender);

        return true;
    }

    /**
     * @notice Withdraw _numTokens ERC20 tokens from the app contract, revoking funds
     * @dev Assume that the contract itself has had enough eth to call transfer function
     * @param _numTokens The number of ERC20 tokens desired in the contract for ERC20 tokens
     */
    function withdrawFundingRights(uint _numTokens) external returns (bool) {
        // withdraw tokens only not locked should be available
        require(_propTokenBalance[msg.sender] >= _numTokens, "Cannot withdraw more than used in proposals");
        _propTokenBalance[msg.sender] = _propTokenBalance[msg.sender].sub(_numTokens);

        // Transfer tokens to the sender address
        // this contract must be able to send the tokens that are not used to the sender
        require(token.transfer(msg.sender, _numTokens));
        emit _FundingRightsWithdrawn(_numTokens, msg.sender);

        return true;
    }

    /**
     * @notice Withdraw funded ERC20 tokens from the contract if the proposal has ended
     * @dev Assure that the proposal has ended and the funds reached the requirement
     * @param _propNonce Integer of the target proposal that has been ended
     */
    function withdrawTokens(uint _propNonce) external returns (bool) {
        // this function can be called from non beneficiary address
        proposal storage p = _propMap[_propNonce];

        require(isExpired(p.endDate), "fundraising has not ended yet");
        require(p.status == true, "raised funds do not meet requirement");

        // Withdraw tokens to the beneficiary address
        require(p.transferred == false, "funds have been withdrawn already");
        require(token.transfer(p.beneficiary, p.raisedFund));
        p.transferred = true;
        p.raisedFund = 0;

        // set zero all elements in p.pendingFunds mapping if possible, how?
        // or can we keep that funding status for tracking purpose with the proposal?
        emit _TokensWithdrawn(_propNonce, msg.sender);

        return true;
    }

    /**
     * @notice Withdraw funds ERC20 tokens from the proposal to the funding rights
     * @dev Assure that the proposal has ended and the funds did not reach the requirement
     * @param _propNonce Integer of the target proposal that has been ended
     */
    function rescueTokens(uint _propNonce) external returns (bool) {
        // this function must be called from each fundraiser to withdraw
        proposal storage p = _propMap[_propNonce];

        require(isExpired(p.endDate), "fundraising has not ended yet");
        require(p.status == false, "raised funds was sufficient");
        // Revert the call if msg.sender did not fund anything on this proposal
        require(_pendingFunds[_propNonce][msg.sender] > 0, "No funds raised by sender");

        // Withdraw ERC20 tokens from the proposal to the funding rights
        _propTokenBalance[msg.sender] = _propTokenBalance[msg.sender].add(_pendingFunds[_propNonce][msg.sender]);
        p.raisedFund = p.raisedFund.sub(_pendingFunds[_propNonce][msg.sender]);
        _pendingFunds[_propNonce][msg.sender] = 0;

        emit _TokensRescued(_propNonce, msg.sender);

        return true;
    }

    // funding interface
    /**
     * @notice Transfer funds ERC20 tokens from the funding rights to the proposal
     * @dev Assure that the proposal has not ended and sender has enough funding rights
     * @param _propNonce Integer of the target proposal that has been ended
     * @param _funding Integer of the funding that the sender transfers
     */
    function fundRaising(uint _propNonce, uint _funding) external returns (bool) {
        proposal storage p = _propMap[_propNonce];

        // Revert the call if the fundraising period is over
        require(!isExpired(p.endDate), "fundraising has ended already");
        require(p.beneficiary != msg.sender, "Cannot fund self-generated proposal");
        require(_propTokenBalance[msg.sender] >= _funding, "Not enough funds in funding rights");

        // raise funds, and substract the raised tokens from propTokenBalance
        p.raisedFund = p.raisedFund.add(_funding);
        _propTokenBalance[msg.sender] = _propTokenBalance[msg.sender].sub(_funding);
        _pendingFunds[_propNonce][msg.sender] = _pendingFunds[_propNonce][msg.sender].add(_funding);

        // set status true if raised fund reaches the requirement
        if (p.raisedFund >= p.requiredFund) {
            p.status = true;
        }

        emit _FundRaising(_propNonce, _funding, msg.sender);
        return true;
    }

    /**
     * @dev Initiates a proposal with canonical configured parameters at propNonce
     * @param _description String of description of the proposal
     * @param _url String of the proposal url that explains the project
     * @param _duration Length of duration in seconds in addition to block.timestamp
     * @param _requiredFund Integer of the required funds for the proposal
     */
    function initializeProposal(bytes32 _description, bytes32 _url, uint _duration, uint _requiredFund) public returns (uint) {
        propNonce = propNonce.add(1);
        address _beneficiary = msg.sender;
        uint _endDate = block.timestamp.add(_duration);

        _propMap[propNonce] = proposal({
            description: _description,
            url: _url,
            beneficiary: _beneficiary,
            endDate: _endDate,
            raisedFund: 0,
            requiredFund: _requiredFund,
            status: false,
            transferred: false
        });

        emit _ProposalInitialized(_description, _endDate, _requiredFund, propNonce, msg.sender);
        return propNonce;
    }

    // helper functions
    /**
     * @dev Checks if an expiration date has been reached
     * @param _endDate Integer timestamp date to compare current timestamp with
     * @return expired Boolean indication of whether the terminationDate has passed
     */
    function isExpired(uint _endDate) public view returns (bool expired) {
        return (block.timestamp >= _endDate);
    }
}

