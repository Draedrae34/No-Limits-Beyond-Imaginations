#!/usr/bin/env python3
"""
PARTIALLY SIGNED BITCOIN TRANSACTION (PSBT) PARSER & SERIALIZER
Implements BIP-174 / BIP-370 key-value binary encoding for Taproot inputs.
"""

import struct
from dataclasses import dataclass, field
from .tx import Transaction, TxIn, TxOut, encode_varint

PSBT_MAGIC = b"psbt\xff"

# Global Types
PSBT_GLOBAL_UNSIGNED_TX = 0x00

# Input Types (BIP-370 & Taproot Extensions)
PSBT_IN_NON_WITNESS_UTXO = 0x00
PSBT_IN_WITNESS_UTXO = 0x01
PSBT_IN_TAP_KEY_SIG = 0x13
PSBT_IN_TAP_SCRIPT_SIG = 0x14
PSBT_IN_TAP_INTERNAL_KEY = 0x17
PSBT_IN_TAP_MERKLE_ROOT = 0x18


def encode_psbt_pair(key_type: int, key_data: bytes, value: bytes) -> bytes:
    """Encodes a single PSBT Key-Value pair."""
    key = bytes([key_type]) + key_data
    return encode_varint(len(key)) + key + encode_varint(len(value)) + value


@dataclass
class PSBTInput:
    witness_utxo: TxOut | None = None
    tap_internal_key: bytes | None = None
    tap_merkle_root: bytes | None = None
    tap_key_sig: bytes | None = None

    def serialize(self) -> bytes:
        res = b""
        if self.witness_utxo:
            val = self.witness_utxo.serialize()
            res += encode_psbt_pair(PSBT_IN_WITNESS_UTXO, b"", val)
        if self.tap_internal_key:
            res += encode_psbt_pair(PSBT_IN_TAP_INTERNAL_KEY, b"", self.tap_internal_key)
        if self.tap_merkle_root:
            res += encode_psbt_pair(PSBT_IN_TAP_MERKLE_ROOT, b"", self.tap_merkle_root)
        if self.tap_key_sig:
            res += encode_psbt_pair(PSBT_IN_TAP_KEY_SIG, b"", self.tap_key_sig)
        res += b"\x00"  # Separator
        return res


class PSBT:
    def __init__(self, tx: Transaction):
        self.tx = tx
        self.inputs = [PSBTInput() for _ in tx.vin]

    def serialize(self) -> bytes:
        """Serializes full PSBT binary format."""
        res = PSBT_MAGIC

        # Global Map: Unsigned Tx
        unsigned_raw = self.tx.serialize()
        res += encode_psbt_pair(PSBT_GLOBAL_UNSIGNED_TX, b"", unsigned_raw)
        res += b"\x00"  # Global Map Separator

        # Input Maps
        for psbt_in in self.inputs:
            res += psbt_in.serialize()

        # Output Maps (Empty separators for basic outputs)
        for _ in self.tx.vout:
            res += b"\x00"

        return res


# DEMO
if __name__ == "__main__":
    tx = Transaction()
    tx.add_input(TxIn(prev_txid=bytes.fromhex("00" * 32), prev_vout=0))
    tx.add_output(TxOut(value=50_000, script_pubkey=bytes.fromhex("5120" + "11" * 32)))

    psbt = PSBT(tx)
    psbt.inputs[0].witness_utxo = TxOut(value=100_000, script_pubkey=bytes.fromhex("5120" + "22" * 32))
    psbt.inputs[0].tap_internal_key = bytes.fromhex("33" * 32)

    psbt_bytes = psbt.serialize()
    print("=== PSBT ENCODER DEMO ===")
    print(f"Magic Check : {psbt_bytes[:5] == PSBT_MAGIC}")
    print(f"PSBT Raw Hex:\n{psbt_bytes.hex()}")
