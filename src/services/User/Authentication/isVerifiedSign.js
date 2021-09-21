import { sha256 } from "js-sha256";
import * as ethUtil from "ethereumjs-util";
import * as sigUtil from "eth-sig-util";

export default ({ signature, publicAddress, nonce }) => {
  /* TODO Need to be implemented */
  const msgBufferHex = ethUtil.bufferToHex(Buffer.from(nonce, "utf8"));
  const address = sigUtil.recoverPersonalSignature({
    data: msgBufferHex,
    sig: signature,
  });

  if (address.toLowerCase() === publicAddress.toLowerCase()) {
    return true;
  } else {
    return false;
  }
};
