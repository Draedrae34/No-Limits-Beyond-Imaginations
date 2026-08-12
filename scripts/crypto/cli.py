#!/usr/bin/env python3
"""
UNIFIED BITCOIN TAPROOT CLI TOOL
Command-line interface for address generation, MAST construction, and transaction signing.
"""

import argparse
import sys
from .secp256k1 import G, point_mul
from .address import pubkey_to_p2wpkh_address, pubkey_to_p2tr_address
from .tapscript import TapMerkleTree, make_control_block
from .tx import Transaction, TxIn, TxOut
from .bip341 import taproot_tweak_pubkey, taproot_tweak_seckey
from .bip340 import schnorr_sign


def cmd_keygen(args):
    privkey = (
        int.from_bytes(bytes.fromhex(args.privkey), "big")
        if args.privkey
        else 0x18E14A7B6A307F426A94F8114701E7C8E774E7F9A47E2C2035DB29A206321725
    )
    pub_point = point_mul(G, privkey)
    x_only = pub_point[0].to_bytes(32, "big")
    prefix = b"\x02" if pub_point[1] % 2 == 0 else b"\x03"
    compressed = prefix + x_only

    print("=== BITCOIN KEYPAIR & ADDRESSES ===")
    print(f"Private Key : 0x{privkey:064x}")
    print(f"X-Only Pub  : {x_only.hex()}")
    print(f"P2WPKH (v0) : {pubkey_to_p2wpkh_address(compressed, hrp=args.hrp)}")
    print(f"P2TR   (v1) : {pubkey_to_p2tr_address(x_only, hrp=args.hrp)}")


def cmd_mast(args):
    scripts = [bytes.fromhex(s) for s in args.scripts]
    tree = TapMerkleTree(scripts)
    root = tree.get_root()

    print("=== TAPROOT MAST MERKLE TREE ===")
    print(f"Merkle Root : {root.hex()}")
    for idx, s in enumerate(scripts):
        proof = tree.get_proof(idx)
        print(f"Leaf {idx} [{s.hex()}] -> Proof: {[p.hex() for p in proof]}")


def cmd_signtx(args):
    privkey = int.from_bytes(bytes.fromhex(args.privkey), "big")
    pub_point = point_mul(G, privkey)
    internal_x = pub_point[0].to_bytes(32, "big")

    tweaked_x, parity = taproot_tweak_pubkey(internal_x)
    spent_script = bytes.fromhex("5120" + tweaked_x.hex())
    spent_utxo = TxOut(value=args.amount_in, script_pubkey=spent_script)

    tx = Transaction(version=2)
    tx.add_input(TxIn(prev_txid=bytes.fromhex(args.txid), prev_vout=args.vout))

    recip_script = bytes.fromhex("5120" + args.to_pubkey)
    tx.add_output(TxOut(value=args.amount_out, script_pubkey=recip_script))

    sighash = tx.get_taproot_sighash(input_index=0, spent_utxos=[spent_utxo])
    tweaked_priv = taproot_tweak_seckey(privkey)
    sig = schnorr_sign(sighash, tweaked_priv)

    tx.vin[0].witness = [sig]
    raw_tx = tx.serialize()

    print("=== SIGNED TAPROOT TRANSACTION ===")
    print(f"Sighash  : {sighash.hex()}")
    print(f"Sig      : {sig.hex()}")
    print(f"Raw Hex  :\n{raw_tx.hex()}")


def main():
    parser = argparse.ArgumentParser(description="Unified Bitcoin Taproot CLI")
    subparsers = parser.add_subparsers(dest="command")

    p_key = subparsers.add_parser("keygen", help="Generate keypair and addresses")
    p_key.add_argument("--privkey", type=str, default=None, help="Private key in 64-char hex")
    p_key.add_argument("--hrp", type=str, default="bc", help="Network prefix ('bc' or 'tb')")

    p_mast = subparsers.add_parser("mast", help="Build MAST Merkle tree from script hexes")
    p_mast.add_argument("scripts", nargs="+", help="Hex string of Tapscript leaves")

    p_tx = subparsers.add_parser("signtx", help="Build and sign raw Taproot transaction")
    p_tx.add_argument("--privkey", required=True, help="Private key hex")
    p_tx.add_argument("--txid", required=True, help="Spent UTXO txid hex")
    p_tx.add_argument("--vout", type=int, default=0, help="Spent UTXO vout")
    p_tx.add_argument("--amount-in", type=int, required=True, help="UTXO amount in sats")
    p_tx.add_argument("--amount-out", type=int, required=True, help="Output amount in sats")
    p_tx.add_argument("--to-pubkey", required=True, help="Recipient 32-byte x-only pubkey hex")

    args = parser.parse_args()
    if args.command == "keygen":
        cmd_keygen(args)
    elif args.command == "mast":
        cmd_mast(args)
    elif args.command == "signtx":
        cmd_signtx(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
