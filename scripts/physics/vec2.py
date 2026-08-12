#!/usr/bin/env python3
"""Pure Python 2D Vector Primitives with Rotational Cross-Products."""

import math


class Vec2:
    __slots__ = ('x', 'y')

    def __init__(self, x: float = 0.0, y: float = 0.0):
        self.x = float(x)
        self.y = float(y)

    def __add__(self, v: 'Vec2') -> 'Vec2':
        return Vec2(self.x + v.x, self.y + v.y)

    def __sub__(self, v: 'Vec2') -> 'Vec2':
        return Vec2(self.x - v.x, self.y - v.y)

    def __mul__(self, scalar: float) -> 'Vec2':
        return Vec2(self.x * scalar, self.y * scalar)

    def __rmul__(self, scalar: float) -> 'Vec2':
        return self.__mul__(scalar)

    def __neg__(self) -> 'Vec2':
        return Vec2(-self.x, -self.y)

    def dot(self, v: 'Vec2') -> float:
        return self.x * v.x + self.y * v.y

    def cross(self, v: 'Vec2') -> float:
        """Vector x Vector -> Scalar (z-component)"""
        return self.x * v.y - self.y * v.x

    def cross_v_s(self, w: float) -> 'Vec2':
        """Vector x Scalar -> Vector (v x s) => perpendicular scaled by scalar"""
        return Vec2(w * self.y, -w * self.x)

    @staticmethod
    def cross_s_v(w: float, v: 'Vec2') -> 'Vec2':
        """Scalar x Vector -> Vector (s x v)"""
        return Vec2(-w * v.y, w * v.x)

    def length_sq(self) -> float:
        return self.x * self.x + self.y * self.y

    def length(self) -> float:
        return math.hypot(self.x, self.y)

    def normalize(self) -> 'Vec2':
        l = self.length()
        return Vec2(self.x / l, self.y / l) if l > 0 else Vec2(0.0, 0.0)

    def rotate(self, angle: float) -> 'Vec2':
        cos_a = math.cos(angle)
        sin_a = math.sin(angle)
        return Vec2(self.x * cos_a - self.y * sin_a, self.x * sin_a + self.y * cos_a)

    def __repr__(self) -> str:
        return f"Vec2({self.x:.2f}, {self.y:.2f})"
