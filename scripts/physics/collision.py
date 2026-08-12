#!/usr/bin/env python3
"""Collision Detection with Contact Point Estimation for Rotational Impulses."""

import math
from .vec2 import Vec2
from .body import RigidBody, ShapeType


class Manifold:
    def __init__(self, a: RigidBody, b: RigidBody):
        self.a = a
        self.b = b
        self.normal = Vec2(0.0, 0.0)
        self.penetration = 0.0
        self.contacts: list[Vec2] = []


def collide(a: RigidBody, b: RigidBody) -> Manifold | None:
    a_min, a_max = a.get_aabb()
    b_min, b_max = b.get_aabb()
    if a_max.x < b_min.x or a_min.x > b_max.x or a_max.y < b_min.y or a_min.y > b_max.y:
        return None

    if a.shape_type == ShapeType.CIRCLE and b.shape_type == ShapeType.CIRCLE:
        return _collide_circles(a, b)
    elif a.shape_type == ShapeType.CIRCLE and b.shape_type == ShapeType.BOX:
        return _collide_circle_box(a, b)
    elif a.shape_type == ShapeType.BOX and b.shape_type == ShapeType.CIRCLE:
        m = _collide_circle_box(b, a)
        if m:
            m.a, m.b = a, b
            m.normal = -m.normal
        return m
    elif (a.shape_type == ShapeType.BOX or a.shape_type == ShapeType.POLYGON) and \
         (b.shape_type == ShapeType.BOX or b.shape_type == ShapeType.POLYGON):
        return _collide_polygons(a, b)
    return None


def _collide_circles(a: RigidBody, b: RigidBody) -> Manifold | None:
    diff = b.position - a.position
    dist_sq = diff.length_sq()
    r_sum = a.radius + b.radius

    if dist_sq >= r_sum * r_sum or dist_sq == 0:
        return None

    dist = math.sqrt(dist_sq)
    m = Manifold(a, b)
    m.penetration = r_sum - dist
    m.normal = diff * (1.0 / dist)

    # Contact point on collision boundary
    contact = a.position + m.normal * a.radius
    m.contacts.append(contact)
    return m


def _collide_circle_box(circle: RigidBody, box: RigidBody) -> Manifold | None:
    # Transform circle position into box local space
    rel_pos = circle.position - box.position
    local_pos = rel_pos.rotate(-box.orientation)

    box_half = Vec2(box.width / 2.0, box.height / 2.0)
    closest_local = Vec2(
        max(-box_half.x, min(box_half.x, local_pos.x)),
        max(-box_half.y, min(box_half.y, local_pos.y)),
    )

    d_local = local_pos - closest_local
    dist_sq = d_local.length_sq()

    if dist_sq >= circle.radius * circle.radius or dist_sq == 0:
        return None

    dist = math.sqrt(dist_sq)
    m = Manifold(circle, box)
    m.penetration = circle.radius - dist

    normal_local = (closest_local - local_pos) * (1.0 / dist)
    m.normal = normal_local.rotate(box.orientation)

    # Contact point in world space
    contact_world = box.position + closest_local.rotate(box.orientation)
    m.contacts.append(contact_world)
    return m


def _project_polygon(axis: Vec2, vertices: list[Vec2]) -> tuple[float, float]:
    min_p = axis.dot(vertices[0])
    max_p = min_p
    for v in vertices[1:]:
        p = axis.dot(v)
        if p < min_p:
            min_p = p
        elif p > max_p:
            max_p = p
    return min_p, max_p


def _collide_polygons(a: RigidBody, b: RigidBody) -> Manifold | None:
    """General SAT implementation for Box and Polygon rigid bodies."""
    verts_a = a.get_vertices()
    verts_b = b.get_vertices()

    axes = []
    # Collect edge normals for Body A
    for i in range(len(verts_a)):
        edge = verts_a[(i + 1) % len(verts_a)] - verts_a[i]
        axes.append(Vec2(-edge.y, edge.x).normalize())

    # Collect edge normals for Body B
    for i in range(len(verts_b)):
        edge = verts_b[(i + 1) % len(verts_b)] - verts_b[i]
        axes.append(Vec2(-edge.y, edge.x).normalize())

    min_overlap = float('inf')
    smallest_axis = Vec2(0, 0)

    for axis in axes:
        min_a, max_a = _project_polygon(axis, verts_a)
        min_b, max_b = _project_polygon(axis, verts_b)

        overlap = min(max_a, max_b) - max(min_a, min_b)
        if overlap <= 0:
            return None  # Separating axis found

        if overlap < min_overlap:
            min_overlap = overlap
            smallest_axis = axis

    # Ensure normal points from A to B
    if smallest_axis.dot(b.position - a.position) < 0:
        smallest_axis = -smallest_axis

    m = Manifold(a, b)
    m.penetration = min_overlap
    m.normal = smallest_axis
    m.contacts.append(a.position + smallest_axis * (min_overlap * 0.5))
    return m
