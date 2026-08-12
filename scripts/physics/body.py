#!/usr/bin/env python3
"""Rigid Body Properties with 2D Rotational Dynamics."""

from .vec2 import Vec2


class ShapeType:
    CIRCLE = 0
    BOX = 1
    POLYGON = 2


def compute_polygon_properties(vertices: list[Vec2], density: float = 1.0):
    """
    Ensures counter-clockwise winding, centers vertices at center of mass,
    and calculates area, mass, and moment of inertia using the shoelace formula.
    Returns (centered_vertices, mass, inertia).
    """
    if not vertices:
        return [], 0.0, 1.0

    # Work on a copy
    verts = [Vec2(v.x, v.y) for v in vertices]

    def _signed_area_and_centroid(vs):
        area2 = 0.0
        cx = 0.0
        cy = 0.0
        n = len(vs)
        for i in range(n):
            v0 = vs[i]
            v1 = vs[(i + 1) % n]
            cross = v0.x * v1.y - v1.x * v0.y
            area2 += cross
            cx += (v0.x + v1.x) * cross
            cy += (v0.y + v1.y) * cross
        signed_area = area2 * 0.5
        return signed_area, cx, cy

    signed_area, cx, cy = _signed_area_and_centroid(verts)
    if abs(signed_area) < 1e-12:
        return verts, 0.0, 1.0

    # Ensure CCW winding
    if signed_area < 0:
        verts.reverse()
        signed_area, cx, cy = _signed_area_and_centroid(verts)

    area = abs(signed_area)
    centroid = Vec2(cx / (6.0 * signed_area), cy / (6.0 * signed_area))

    # Recenter vertices around centroid
    centered = [v - centroid for v in verts]

    # Polygon moment of inertia via shoelace-based summation
    denom = 0.0
    numer = 0.0
    n = len(centered)
    for i in range(n):
        v0 = centered[i]
        v1 = centered[(i + 1) % n]
        cross = abs(v0.x * v1.y - v1.x * v0.y)
        numer += cross * (v0.dot(v0) + v0.dot(v1) + v1.dot(v1))
        denom += cross

    mass = area * density
    inertia = (mass / 6.0) * (numer / denom) if denom != 0 else 1.0
    return centered, mass, inertia


class RigidBody:
    def __init__(
        self,
        x: float,
        y: float,
        mass: float = 1.0,
        is_static: bool = False,
        shape_type: int = ShapeType.CIRCLE,
        radius: float = 1.0,
        width: float = 2.0,
        height: float = 2.0,
        restitution: float = 0.7,
        orientation: float = 0.0,
        vertices: list | None = None,
    ):
        self.position = Vec2(x, y)
        self.velocity = Vec2(0.0, 0.0)
        self.force = Vec2(0.0, 0.0)

        self.orientation = orientation  # Radians
        self.angular_velocity = 0.0
        self.torque = 0.0

        self.is_static = is_static
        self.mass = mass
        self.inv_mass = 0.0 if (is_static or mass == 0.0) else 1.0 / mass
        self.restitution = restitution

        self.shape_type = shape_type
        self.radius = radius
        self.width = width
        self.height = height
        self.local_vertices = None
        if vertices is not None:
            # Expect list of Vec2 local-space vertices (centered around origin)
            self.local_vertices = [Vec2(v.x, v.y) for v in vertices]

        # Compute Moment of Inertia (I) and Inverse Inertia (1/I)
        if is_static or mass == 0.0:
            self.inertia = 0.0
            self.inv_inertia = 0.0
        elif shape_type == ShapeType.CIRCLE:
            self.inertia = 0.5 * mass * (radius * radius)
            self.inv_inertia = 1.0 / self.inertia
        else:  # BOX
            self.inertia = (1.0 / 12.0) * mass * (width * width + height * height)
            self.inv_inertia = 1.0 / self.inertia

        # If polygon provided, compute proper centered vertices and inertia
        if self.shape_type == ShapeType.POLYGON and self.local_vertices:
            # First compute area using unit density to get area
            centered, area_mass, inertia = compute_polygon_properties(self.local_vertices, density=1.0)
            if area_mass > 0.0:
                # scale density so that polygon mass matches provided mass
                density = self.mass / area_mass if self.mass > 0.0 else 1.0
                centered, mass_calc, inertia = compute_polygon_properties(self.local_vertices, density=density)
                # replace stored local vertices with centered ones
                self.local_vertices = centered
                # inertia returned already uses density-scaled mass
                self.inertia = inertia
                self.inv_inertia = 1.0 / self.inertia if self.inertia != 0 else 0.0

    def apply_force(self, f: Vec2):
        if not self.is_static:
            self.force = self.force + f

    def apply_force_at_point(self, f: Vec2, point: Vec2):
        """Applies a force at a specific world position, creating torque."""
        if self.is_static:
            return
        self.force = self.force + f
        r = point - self.position
        self.torque += r.cross(f)

    def apply_torque(self, t: float):
        if not self.is_static:
            self.torque += t

    def get_aabb(self) -> tuple[Vec2, Vec2]:
        if self.shape_type == ShapeType.CIRCLE:
            r_vec = Vec2(self.radius, self.radius)
            return self.position - r_vec, self.position + r_vec
        elif self.shape_type == ShapeType.BOX:
            half_w, half_h = self.width / 2.0, self.height / 2.0
            corners = [
                Vec2(-half_w, -half_h).rotate(self.orientation),
                Vec2(half_w, -half_h).rotate(self.orientation),
                Vec2(half_w, half_h).rotate(self.orientation),
                Vec2(-half_w, half_h).rotate(self.orientation),
            ]
            xs = [c.x + self.position.x for c in corners]
            ys = [c.y + self.position.y for c in corners]
            return Vec2(min(xs), min(ys)), Vec2(max(xs), max(ys))
        else:  # POLYGON
            verts = self.get_vertices()
            xs = [v.x for v in verts]
            ys = [v.y for v in verts]
            return Vec2(min(xs), min(ys)), Vec2(max(xs), max(ys))

    def get_vertices(self) -> list:
        """Return world-space vertices for BOX or POLYGON."""
        if self.shape_type == ShapeType.BOX:
            half_w, half_h = self.width / 2.0, self.height / 2.0
            local = [
                Vec2(-half_w, -half_h),
                Vec2(half_w, -half_h),
                Vec2(half_w, half_h),
                Vec2(-half_w, half_h),
            ]
            return [self.position + v.rotate(self.orientation) for v in local]
        elif self.shape_type == ShapeType.POLYGON and self.local_vertices:
            return [self.position + v.rotate(self.orientation) for v in self.local_vertices]
        else:
            return []
