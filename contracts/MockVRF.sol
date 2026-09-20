// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {IVRFCoordinatorV2Plus} from "./Bnbfish.sol";
interface IConsumer {function rawFulfillRandomWords(uint256,uint256[] calldata) external;}
contract MockVRF is IVRFCoordinatorV2Plus {
 uint256 public next=1;mapping(uint256=>address) public consumers;
 constructor(){require(block.chainid==1337,"LOCAL_ONLY");}
 function requestRandomWords(Request calldata) external returns(uint256 id){id=next++;consumers[id]=msg.sender;}
 function fulfill(uint256 id,uint256 word) external {uint256[] memory words=new uint256[](1);words[0]=word;IConsumer(consumers[id]).rawFulfillRandomWords(id,words);}
}
