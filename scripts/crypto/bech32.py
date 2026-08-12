#!/usr/bin/env python3
"""
PURE PYTHON BECH32 / BECH32M ENCODER (BIP-173 & BIP-350)
Translates SegWit (v0) and Taproot (v1) public key payloads 
into human-readable 'bc1q...' and 'bc1p...' Bitcoin addresses.
"""

# Base32 alphabet used specifically for Bech32/Bech32m encoding
BECH32_ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"

# Constants for checksum verification and encoding variants
BECH32_CONST = 1
BECH32M_CONST = 0x2bc830a3

def bech32_polymod(values: list[int]) -> int:
    """Internal generator polynomial checksum computation."""
    generator = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
    chk = 1
    for v in values:
        top = chk >> 25
        chk = ((chk & 0x1ffffff) << 5) ^ v
        for i in range(5):
            if (top >> i) & 1:
                chk ^= generator[i]
    return chk

def hrp_expand(hrp: str) -> list[int]:
    """Expands the Human-Readable Part (e.g., 'bc') into values for checksumting."""
    return [ord(x) >> 5 for x in hrp] + [0] + [ord(x) & 31 for x in hrp]

def create_checksum(hrp: str, data: list[int], spec_const: int) -> list[int]:
    """Calculates the 6-character checksum appended to the address payload."""
    values = hrp_expand(hrp) + data + [0, 0, 0, 0, 0, 0]
    mod = bech32_polymod(values) ^ spec_const
    return [(mod >> (5 * (5 - i))) & 31 for i in range(6)]

def convertbits(data: bytes, frombits: int, tobits: int, pad: bool = True) -> list[int]:
    """
    Bit-packing helper: converts 8-bit byte arrays into 5-bit integers 
    required for Base32 character indexing.
    """
    acc = 0
    bits = 0
    ret = []
    maxv = (1 << tobits) - 1
    max_acc = (1 << (frombits + tobits - 1)) - 1
    for value in data:
        if value < 0 or (value >> frombits):
            raise ValueError("Invalid byte value for conversion.")
        acc = ((acc << frombits) | value) & max_acc
        bits += frombits
        while bits >= tobits:
            bits -= tobits
            ret.append((acc >> bits) & maxv)
    if pad:
        if bits:
            ret.append((acc << (tobits - bits)) & maxv)
    elif bits >= frombits or ((acc << (tobits - bits)) & maxv):
        raise ValueError("Invalid padding bit remnants.")
    return ret

def encode_bech32_address(hrp: str, witness_version: int, witness_program: bytes) -> str:
    """
    Encodes a witness program into a valid SegWit or Taproot address.
    - Version 0 (Native SegWit P2WPKH) -> Uses standard Bech32 (BIP-173)
    - Version 1 (Taproot P2TR)         -> Uses Bech32m (BIP-350)
    """
    spec_const = BECH32M_CONST if witness_version > 0 else BECH32_CONST
    
    # 1. Convert 8-bit program payload into 5-bit chunks
    data_5bit = convertbits(witness_program, 8, 5, pad=True)
    
    # 2. Prepend witness version byte (0 for SegWit v0, 1 for Taproot v1)
    full_payload = [witness_version] + data_5bit
    
    # 3. Compute Checksum and encode
    checksum = create_checksum(hrp, full_payload, spec_const)
    combined = full_payload + checksum
    
    return hrp + "1" + "".join(BECH32_ALPHABET[p] for p in combined)

# =====================================================================
# DEMO & INTEGRATION WITH SECP256K1 CURVE ENGINE
# =====================================================================

if __name__ == "__main__":
    import hashlib
    from .secp256k1 import scalar_mult, G
    print("=== BECH32 & BECH32M ADDRESS ENCODING DEMO ===\n")

    # Sample Public Key Point derived from SECP256K1
    test_privkey = 0x18E14A7B6A307F426A94F8114701E7C8E774E7F9A47E2C2035DB29A206321725
    pub_point = scalar_mult(test_privkey, G)
    assert pub_point is not None

    # Compressed Pubkey (33 Bytes)
    prefix = b'\x02' if pub_point[1] % 2 == 0 else b'\x03'
    compressed_pub = prefix + pub_point[0].to_bytes(32, 'big')

    # --- 1. SegWit v0 (P2WPKH) Address ---
    # Witness Program = RIPEMD160(SHA256(Compressed Public Key))
    sha = hashlib.sha256(compressed_pub).digest()
    try:
        ripemd = hashlib.new('ripemd160')
        ripemd.update(sha)
        p2wpkh_program = ripemd.digest()
    except ValueError:
        raise RuntimeError("RIPEMD160 hash not available in this Python build")
    p2wpkh_addr = encode_bech32_address("bc", 0, p2wpkh_program)

    print("--- 1. Native SegWit v0 (P2WPKH) ---")
    print(f"Witness Program (20-byte hash): {p2wpkh_program.hex()}")
    print(f"SegWit Address                : {p2wpkh_addr}")
    assert p2wpkh_addr.startswith("bc1q"), "Native SegWit v0 addresses must start with 'bc1q'!"
    print("✔ SegWit v0 Encoding PASSED\n")

    # --- 2. Taproot v1 (P2TR) Address ---
    # Witness Program = 32-byte x-only coordinate of public key
    x_only_pubkey = pub_point[0].to_bytes(32, 'big')
    p2tr_addr = encode_bech32_address("bc", 1, x_only_pubkey)

    print("--- 2. Taproot v1 (P2TR) ---")
    print(f"Witness Program (32-byte x-key): {x_only_pubkey.hex()}")
    print(f"Taproot Address               : {p2tr_addr}")
    assert p2tr_addr.startswith("bc1p"), "Taproot v1 addresses must start with 'bc1p'!"
    print("✔ Taproot v1 Encoding PASSED")
