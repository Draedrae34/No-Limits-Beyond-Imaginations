#!/usr/bin/env python3
"""
BITCOIN DESCRIPTOR & WALLET STATE MANAGER
Tracks UTXOs, parses descriptors (tr(), wpkh()), and auto-builds spend transactions.
"""

from dataclasses import dataclass
from .secp256k1 import G, point_mul
from .address import pubkey_to_p2wpkh_address, pubkey_to_p2tr_address
from .bip341 import taproot_tweak_pubkey, taproot_tweak_seckey
from .bip340 import schnorr_sign
from .tx import Transaction, TxIn, TxOut


@dataclass
class UTXO:
    txid: str
    vout: int
    amount: int  # Satoshis
    script_pubkey: bytes


class Wallet:
    def __init__(self, privkey: int, hrp: str = "bc"):
        self.privkey = privkey
        self.hrp = hrp

        pub_point = point_mul(G, privkey)
        self.internal_x = pub_point[0].to_bytes(32, "big")
        prefix = b"\x02" if pub_point[1] % 2 == 0 else b"\x03"
        self.compressed_pub = prefix + self.internal_x

        self.tweaked_x, _ = taproot_tweak_pubkey(self.internal_x)
        self.utxos: list[UTXO] = []

    def get_descriptor(self) -> str:
        """Returns the Taproot output descriptor for this wallet."""
        return f"tr({self.internal_x.hex()})"

    def get_taproot_address(self) -> str:
        return pubkey_to_p2tr_address(self.internal_x, hrp=self.hrp)

    def add_utxo(self, txid: str, vout: int, amount: int):
        script_pubkey = bytes.fromhex("5120" + self.tweaked_x.hex())
        self.utxos.append(UTXO(txid=txid, vout=vout, amount=amount, script_pubkey=script_pubkey))

    def get_balance(self) -> int:
        return sum(u.amount for u in self.utxos)

    def build_spend_tx(self, recipient_script: bytes, amount: int, fee: int) -> Transaction:
        """Selects UTXOs and builds a fully signed Taproot transaction."""
        total_needed = amount + fee
        selected_utxos: list[UTXO] = []
        accumulated = 0

        for utxo in self.utxos:
            selected_utxos.append(utxo)
            accumulated += utxo.amount
            if accumulated >= total_needed:
                break

        if accumulated < total_needed:
            raise ValueError(f"Insufficient funds: Have {accumulated} sats, need {total_needed} sats.")

        tx = Transaction(version=2)
        spent_utxos = []

        for utxo in selected_utxos:
            tx.add_input(TxIn(prev_txid=bytes.fromhex(utxo.txid), prev_vout=utxo.vout))
            spent_utxos.append(TxOut(value=utxo.amount, script_pubkey=utxo.script_pubkey))

        # Recipient output
        tx.add_output(TxOut(value=amount, script_pubkey=recipient_script))

        # Change output if remaining balance exists
        change = accumulated - total_needed
        if change > 546:  # Exclude dust outputs
            change_script = bytes.fromhex("5120" + self.tweaked_x.hex())
            tx.add_output(TxOut(value=change, script_pubkey=change_script))

        # Sign all inputs
        tweaked_priv = taproot_tweak_seckey(self.privkey)
        for i in range(len(tx.vin)):
            sighash = tx.get_taproot_sighash(input_index=i, spent_utxos=spent_utxos)
            sig = schnorr_sign(sighash, tweaked_priv)
            tx.vin[i].witness = [sig]

        return tx


# DEMO
if __name__ == "__main__":
    privkey = 0x18E14A7B6A307F426A94F8114701E7C8E774E7F9A47E2C2035DB29A206321725
    wallet = Wallet(privkey)

    print("=== WALLET STATE MANAGER DEMO ===")
    print(f"Descriptor  : {wallet.get_descriptor()}")
    print(f"P2TR Address: {wallet.get_taproot_address()}")

    # Fund wallet
    wallet.add_utxo(txid="11" * 32, vout=0, amount=100_000)
    wallet.add_utxo(txid="22" * 32, vout=1, amount=150_000)
    print(f"Total Balance: {wallet.get_balance()} sats")

    # Spend
    recip = bytes.fromhex("5120" + "33" * 32)
    signed_tx = wallet.build_spend_tx(recipient_script=recip, amount=180_000, fee=5_000)

    raw_hex = signed_tx.serialize().hex()
    print(f"Signed Tx Hex:\n{raw_hex[:80]}...({len(raw_hex)//2} bytes)")
    print("[OK] Wallet spending transaction constructed and signed successfully!")
