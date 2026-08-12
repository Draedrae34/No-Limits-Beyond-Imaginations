#!/usr/bin/env python3
"""Physics Solver with Rotational Dynamics & Angular Impulses."""

from .vec2 import Vec2
from .body import RigidBody
from .collision import collide


class PhysicsWorld:
    def __init__(
        self,
        gravity: Vec2 = Vec2(0.0, -9.81),
        slop: float = 0.01,
        percent: float = 0.4,
        iterations: int = 10,
    ):
        self.gravity = gravity
        self.slop = slop
        self.percent = percent
        self.iterations = iterations
        self.bodies: list[RigidBody] = []

    def add_body(self, body: RigidBody):
        self.bodies.append(body)

    def step(self, dt: float):
        # 1. Integrate Forces & Torques
        for body in self.bodies:
            if body.is_static:
                continue
            body.apply_force(self.gravity * body.mass)

            # Linear acceleration
            accel = body.force * body.inv_mass
            body.velocity = body.velocity + accel * dt

            # Angular acceleration (alpha = tau / I)
            alpha = body.torque * body.inv_inertia
            body.angular_velocity += alpha * dt

            # Clear forces/torques
            body.force = Vec2(0.0, 0.0)
            body.torque = 0.0

        # 2. Iterative Collision Resolution
        for _ in range(self.iterations):
            for i in range(len(self.bodies)):
                for j in range(i + 1, len(self.bodies)):
                    a, b = self.bodies[i], self.bodies[j]
                    if a.is_static and b.is_static:
                        continue

                    manifold = collide(a, b)
                    if manifold:
                        self._resolve_collision(manifold)
                        self._positional_correction(manifold)

        # 3. Integrate Positions & Orientations
        for body in self.bodies:
            if not body.is_static:
                body.position = body.position + body.velocity * dt
                body.orientation += body.angular_velocity * dt

    def _resolve_collision(self, m):
        a, b = m.a, m.b
        if not m.contacts:
            return

        contact = m.contacts[0]
        r_a = contact - a.position
        r_b = contact - b.position

        vp_a = a.velocity + Vec2.cross_s_v(a.angular_velocity, r_a)
        vp_b = b.velocity + Vec2.cross_s_v(b.angular_velocity, r_b)
        rv = vp_b - vp_a

        vel_along_normal = rv.dot(m.normal)
        if vel_along_normal > 0:
            return

        r_a_cross_n = r_a.cross(m.normal)
        r_b_cross_n = r_b.cross(m.normal)

        inv_mass_sum = (
            a.inv_mass
            + b.inv_mass
            + (r_a_cross_n * r_a_cross_n) * a.inv_inertia
            + (r_b_cross_n * r_b_cross_n) * b.inv_inertia
        )

        e = min(a.restitution, b.restitution)
        j = -(1.0 + e) * vel_along_normal / inv_mass_sum
        impulse = m.normal * j

        a.velocity = a.velocity - impulse * a.inv_mass
        b.velocity = b.velocity + impulse * b.inv_mass
        a.angular_velocity -= r_a.cross(impulse) * a.inv_inertia
        b.angular_velocity += r_b.cross(impulse) * b.inv_inertia

    def _positional_correction(self, m):
        corr = max(m.penetration - self.slop, 0.0) / (m.a.inv_mass + m.b.inv_mass) * self.percent
        correction = m.normal * corr
        m.a.position = m.a.position - correction * m.a.inv_mass
        m.b.position = m.b.position + correction * m.b.inv_mass
