#!/usr/bin/env python3
"""Transaction types, serialization, and Taproot sighash computation."""

from typing import List

from .bip341 import taproot_sighash


def encode_varint(n: int) -> bytes:
    if n < 0xFD:
        return bytes([n])
    elif n <= 0xFFFF:
        return b"\xFD" + n.to_bytes(2, "little")
    elif n <= 0xFFFFFFFF:
        return b"\xFE" + n.to_bytes(4, "little")
    else:
        return b"\xFF" + n.to_bytes(8, "little")


class TxOut:
    def __init__(self, value: int, script_pubkey: bytes):
        self.value = value
        self.script_pubkey = script_pubkey

    def serialize(self) -> bytes:
        script = self.script_pubkey
        return self.value.to_bytes(8, "little") + encode_varint(len(script)) + script


class TxIn:
    def __init__(
        self,
        prev_txid: bytes,
        prev_vout: int,
        sequence: int = 0xFFFFFFFF,
        witness: list = None,
    ):
        self.prev_txid = prev_txid
        self.prev_vout = prev_vout
        self.sequence = sequence
        self.witness = witness or []

    def serialize(self) -> bytes:
        return (
            self.prev_txid[::-1]
            + self.prev_vout.to_bytes(4, "little")
            + self.sequence.to_bytes(4, "little")
        )


class Transaction:
    def __init__(self, version: int = 2, locktime: int = 0):
        self.version = version
        self.locktime = locktime
        self.vin: List[TxIn] = []
        self.vout: List[TxOut] = []

    def add_input(self, txin: TxIn):
        self.vin.append(txin)

    def add_output(self, txout: TxOut):
        self.vout.append(txout)

    def serialize(self) -> bytes:
        buf = self.version.to_bytes(4, "little")
        buf += encode_varint(len(self.vin))
        for inp in self.vin:
            buf += inp.serialize()
        buf += encode_varint(len(self.vout))
        for out in self.vout:
            buf += out.serialize()
        buf += self.locktime.to_bytes(4, "little")
        return buf

    def get_taproot_sighash(self, input_index: int, spent_utxos: list) -> bytes:
        inputs = []
        amounts = []
        script_codes = []

        for i, inp in enumerate(self.vin):
            inputs.append(
                {
                    "txid": inp.prev_txid,
                    "vout": inp.prev_vout,
                    "sequence": inp.sequence,
                }
            )
            if i < len(spent_utxos):
                amounts.append(spent_utxos[i].value)
                script_codes.append(spent_utxos[i].script_pubkey)
            else:
                amounts.append(0)
                script_codes.append(b"")

        outputs = []
        for out in self.vout:
            outputs.append(
                {
                    "value": out.value,
                    "script": out.script_pubkey,
                }
            )

        return taproot_sighash(
            tx_version=self.version,
            locktime=self.locktime,
            inputs=inputs,
            outputs=outputs,
            input_index=input_index,
            sighash_type=0x00,
            amounts=amounts,
            script_codes=script_codes,
        )
