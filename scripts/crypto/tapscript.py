#!/usr/bin/env python3
"""Tapscript utilities and MAST Merkle tree."""

import hashlib


class TapMerkleTree:
    def __init__(self, leaves: list):
        self.leaves = leaves
        self.tree = self._build_tree(leaves)

    def _build_tree(self, leaves):
        if not leaves:
            return [hashlib.sha256(b"").digest()]
        tree = list(leaves)
        layer = [hashlib.sha256(leaf).digest() for leaf in leaves]
        tree.extend(layer)
        while len(layer) > 1:
            next_layer = []
            for i in range(0, len(layer), 2):
                if i + 1 < len(layer):
                    combined = layer[i] + layer[i + 1]
                else:
                    combined = layer[i] + layer[i]
                next_layer.append(hashlib.sha256(combined).digest())
            layer = next_layer
            tree.extend(layer)
        return tree

    def get_root(self):
        if not self.tree:
            return hashlib.sha256(b"").digest()
        return self.tree[-1]

    def get_proof(self, index: int):
        proof = []
        layer_start = 0
        layer_size = len(self.leaves)
        idx = index
        while layer_size > 1:
            pair_idx = idx ^ 1
            if pair_idx < layer_size:
                proof.append(self.tree[layer_start + pair_idx])
            idx //= 2
            layer_start += layer_size
            layer_size = (layer_size + 1) // 2
        return proof


def make_control_block(internal_key: bytes, merkle_root: bytes) -> bytes:
    return b"\x02" + internal_key + merkle_root
