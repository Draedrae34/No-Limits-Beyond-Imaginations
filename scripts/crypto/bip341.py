#!/usr/bin/env python3
"""
BIP-341: Pure Python Taproot key tweaking and sighash computation.
"""
import hashlib
from .secp256k1 import n, G, scalar_mult, point_add, point_from_x
from .bip340 import tagged_hash

def taproot_tweak_seckey(seckey: int, merkle_root: bytes = None) -> int:
    if not (0 < seckey < n):
        raise ValueError("Secret key must be in 1..n-1")
    P = scalar_mult(seckey, G)
    if P is None:
        raise ValueError("Invalid secret key")
    if merkle_root is None:
        tweak = tagged_hash("TapTweak", P[0].to_bytes(32, 'big'))
    else:
        tweak = tagged_hash("TapTweak", P[0].to_bytes(32, 'big') + merkle_root)
    t = int.from_bytes(tweak, 'big') % n
    return (seckey + t) % n

def taproot_tweak_pubkey(pubkey: bytes, merkle_root: bytes = None) -> tuple:
    x = int.from_bytes(pubkey, 'big')
    if x >= 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F:
        raise ValueError("Invalid x-coordinate")
    if merkle_root is None:
        tweak = tagged_hash("TapTweak", pubkey)
    else:
        tweak = tagged_hash("TapTweak", pubkey + merkle_root)
    t = int.from_bytes(tweak, 'big') % n
    P = point_from_x(x, False)
    Q = point_add(P, scalar_mult(t, G))
    if Q is None:
        raise ValueError("Invalid point arithmetic")
    return Q[0].to_bytes(32, 'big'), t

def _sighash_inputs_serialize(inputs, input_index, sighash_type, amounts, script_codes):
    buf = bytearray()
    any_input = (sighash_type & 0x80) == 0
    if not any_input:
        return bytes(buf)
    for i, inp in enumerate(inputs):
        buf += inp['txid'][::-1] + inp['vout'].to_bytes(4, 'little')
        buf += amounts[i].to_bytes(8, 'little')
        if i == input_index:
            sc = script_codes[i] if script_codes and i < len(script_codes) else b''
            if len(sc) > 0:
                buf += len(sc).to_bytes(1, 'big') + sc
        buf += inp['sequence'].to_bytes(4, 'little')
    return bytes(buf)

def _sighash_outputs_serialize(outputs, input_index, sighash_type):
    if sighash_type & 0x80:
        return b''
    mask = sighash_type & 0x03
    if mask == 0x01:  # ALL
        buf = bytearray()
        for out in outputs:
            buf += out['value'].to_bytes(8, 'little')
            buf += len(out['script']).to_bytes(1, 'big') + out['script']
        return bytes(buf)
    elif mask == 0x02:  # NONE
        return b''
    elif mask == 0x03:  # SINGLE
        if input_index >= len(outputs):
            return b''
        buf = bytearray()
        for j in range(input_index, len(outputs)):
            out = outputs[j]
            buf += out['value'].to_bytes(8, 'little')
            buf += len(out['script']).to_bytes(1, 'big') + out['script']
        return bytes(buf)
    else:  # DEFAULT
        buf = bytearray()
        for out in outputs:
            buf += out['value'].to_bytes(8, 'little')
            buf += len(out['script']).to_bytes(1, 'big') + out['script']
        return bytes(buf)

def taproot_sighash(tx_version, locktime, inputs, outputs, input_index,
                    sighash_type=0x00, amounts=None, script_codes=None):
    amounts = amounts or [0] * len(inputs)
    script_codes = script_codes or [b''] * len(inputs)
    sighash = sighash_type.to_bytes(4, 'little')
    tx_ver = tx_version.to_bytes(4, 'little')
    lt = locktime.to_bytes(4, 'little')
    inp_ser = _sighash_inputs_serialize(inputs, input_index, sighash_type, amounts, script_codes)
    out_ser = _sighash_outputs_serialize(outputs, input_index, sighash_type)
    preimage = sighash + tx_ver + lt + hashlib.sha256(inp_ser).digest() + hashlib.sha256(out_ser).digest()
    return hashlib.sha256(preimage).digest()
