#!/usr/bin/env python3
"""Bitcoin address encoding utilities."""

import hashlib
from .bech32 import encode_bech32_address


def pubkey_to_p2wpkh_address(compressed_pubkey: bytes, hrp: str = "bc") -> str:
    sha = hashlib.sha256(compressed_pubkey).digest()
    try:
        ripemd = hashlib.new("ripemd160")
        ripemd.update(sha)
        p2wpkh_program = ripemd.digest()
    except ValueError:
        raise RuntimeError("RIPEMD160 hash not available")
    return encode_bech32_address(hrp, 0, p2wpkh_program)


def pubkey_to_p2tr_address(x_only_pubkey: bytes, hrp: str = "bc") -> str:
    return encode_bech32_address(hrp, 1, x_only_pubkey)
