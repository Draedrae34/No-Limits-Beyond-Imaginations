#!/usr/bin/env python3
"""
Minimal pure-Python secp256k1 implementation (affine coordinates).
"""

p = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
a = 0
b = 7
Gx = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798
Gy = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8
n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141

def modinv(a, m=p):
    return pow(a, m - 2, m)

def point_add(p1, p2):
    if p1 is None:
        return p2
    if p2 is None:
        return p1
    (x1, y1) = p1
    (x2, y2) = p2
    if x1 == x2:
        if (y1 + y2) % p == 0:
            return None
        lam = (3 * x1 * x1 + a) * modinv(2 * y1) % p
    else:
        lam = (y2 - y1) * modinv(x2 - x1) % p
    x3 = (lam * lam - x1 - x2) % p
    y3 = (lam * (x1 - x3) - y1) % p
    return (x3, y3)

def point_double(pt):
    if pt is None:
        return None
    (x, y) = pt
    lam = (3 * x * x + a) * modinv(2 * y) % p
    x3 = (lam * lam - 2 * x) % p
    y3 = (lam * (x - x3) - y) % p
    return (x3, y3)

def scalar_mult(k, p):
    result = None
    addend = p
    k = k % n
    while k:
        if k & 1:
            result = point_add(result, addend)
        addend = point_double(addend)
        k >>= 1
    return result

G = (Gx, Gy)

def point_mul(pt, scalar):
    return scalar_mult(scalar, pt)

def x_only_pubkey(seckey: int) -> int:
    pt = scalar_mult(seckey, G)
    assert pt is not None
    return pt[0]

def point_from_x(x: int, y_is_odd: bool):
    y_sq = (x * x * x + a * x + b) % p
    y = pow(y_sq, (p + 1) // 4, p)
    if (y * y) % p != y_sq:
        return None
    if y % 2 != y_is_odd:
        y = p - y
    return (x, y)
