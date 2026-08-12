#!/usr/bin/env python3
"""
BIP-340: Pure Python Schnorr signatures over secp256k1.
"""
import hashlib
from .secp256k1 import n, G, scalar_mult, point_add, point_from_x, p

_TAG_PREFIX = lambda tag: hashlib.sha256(tag.encode()).digest()

def tagged_hash(tag: str, msg: bytes) -> bytes:
    tag_hash = _TAG_PREFIX(tag)
    return hashlib.sha256(tag_hash + tag_hash + msg).digest()

def keypair(seckey: int) -> tuple:
    if not (0 < seckey < n):
        raise ValueError("Secret key must be in 1..n-1")
    x = scalar_mult(seckey, G)
    assert x is not None
    if x[1] % 2 != 0:
        seckey = n - seckey
    return seckey, x[0].to_bytes(32, 'big')

def sign(msg: bytes, seckey: int, aux_rand: bytes = None) -> bytes:
    if not (0 < seckey < n):
        raise ValueError("Secret key must be in 1..n-1")
    d = seckey
    P = scalar_mult(d, G)
    if P is None:
        raise ValueError("Invalid secret key")
    if P[1] % 2 != 0:
        d = n - d
    k = 0
    if aux_rand is not None:
        k = int.from_bytes(tagged_hash("BIP340/aux", aux_rand), 'big')
    t = (d + k) % n
    k_prime = int.from_bytes(tagged_hash("BIP340/nonce", t.to_bytes(32, 'big') + P[0].to_bytes(32, 'big') + msg), 'big') % n
    if k_prime == 0:
        raise ValueError("Nonce is zero")
    R = scalar_mult(k_prime, G)
    if R is None:
        raise ValueError("Nonce is invalid")
    if R[1] % 2 != 0:
        k_prime = n - k_prime
    e = int.from_bytes(tagged_hash("BIP340/challenge", R[0].to_bytes(32, 'big') + P[0].to_bytes(32, 'big') + msg), 'big') % n
    s = (k_prime + e * d) % n
    if s == 0:
        raise ValueError("Signature s is zero")
    return R[0].to_bytes(32, 'big') + s.to_bytes(32, 'big')

schnorr_sign = sign

def verify(pubkey: bytes, msg: bytes, sig: bytes) -> bool:
    if len(pubkey) != 32 or len(sig) != 64:
        return False
    x = int.from_bytes(pubkey, 'big')
    if x >= p:
        return False
    r = int.from_bytes(sig[:32], 'big')
    s = int.from_bytes(sig[32:], 'big')
    if s >= n:
        return False
    P = point_from_x(x, False)
    if P is None:
        return False
    e = int.from_bytes(tagged_hash("BIP340/challenge", sig[:32] + pubkey + msg), 'big') % n
    R = point_add(scalar_mult(s, G), scalar_mult((n - e) % n, P))
    if R is None:
        return False
    return R[0] == r and R[1] % 2 == 0
