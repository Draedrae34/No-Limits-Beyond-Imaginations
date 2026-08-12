#!/usr/bin/env python3
"""
Headless CLI Test Harness for Rigid Body 2D Engine with GJK / EPA / Clipping.
Logs kinetic energy, system momentum, and collision metrics across simulation steps.
"""

import sys
import math
import time
import argparse
import csv

# (The user-provided headless harness content is added here)

class Vector2D:
    def __init__(self, x=0.0, y=0.0):
        self.x = float(x)
        self.y = float(y)

    def __add__(self, o): return Vector2D(self.x + o.x, self.y + o.y)
    def __sub__(self, o): return Vector2D(self.x - o.x, self.y - o.y)
    def __mul__(self, s): return Vector2D(self.x * s, self.y * s)
    def __rmul__(self, s): return Vector2D(self.x * s, self.y * s)
    def dot(self, o): return self.x * o.x + self.y * o.y
    def cross_z(self, o): return self.x * o.y - self.y * o.x
    def length_sq(self): return self.x**2 + self.y**2
    def length(self): return math.hypot(self.x, self.y)

    def normalize(self):
        l = self.length()
        return Vector2D(self.x / l, self.y / l) if l > 1e-9 else Vector2D(0.0, 0.0)

    def neg(self): return Vector2D(-self.x, -self.y)
    def perpendicular(self): return Vector2D(-self.y, self.x)
    def __repr__(self): return f"Vector2D({self.x:.3f}, {self.y:.3f})"

def cross_v_s(v, s): return Vector2D(v.y * s, -v.x * s)
def cross_s_v(s, v): return Vector2D(-s * v.y, s * v.x)

class RigidBody:
    def __init__(self, pos, vertices, mass=1.0, is_static=False):
        self.pos = pos
        self.local_vertices = vertices
        self.mass = mass
        self.inv_mass = 0.0 if is_static or mass == 0 else 1.0 / mass
        self.angle = 0.0
        self.linear_vel = Vector2D(0, 0)
        self.angular_vel = 0.0
        self.force = Vector2D(0, 0)
        self.torque = 0.0
        self.is_static = is_static
        self.restitution = 0.2
        self.friction = 0.4

        if is_static:
            self.inertia = 0.0
            self.inv_inertia = 0.0
        else:
            self.inertia = self._calculate_inertia()
            self.inv_inertia = 1.0 / self.inertia if self.inertia > 0 else 0.0

    def _calculate_inertia(self):
        acc_num = 0.0
        acc_den = 0.0
        verts = self.local_vertices
        for i in range(len(verts)):
            v1 = verts[i]
            v2 = verts[(i + 1) % len(verts)]
            cross = abs(v1.cross_z(v2))
            acc_num += cross * (v1.dot(v1) + v1.dot(v2) + v2.dot(v2))
            acc_den += cross
        return (self.mass / 6.0) * (acc_num / acc_den) if acc_den > 0 else self.mass * 100.0

    def get_transformed_vertices(self):
        cos_a = math.cos(self.angle)
        sin_a = math.sin(self.angle)
        transformed = []
        for v in self.local_vertices:
            rx = v.x * cos_a - v.y * sin_a
            ry = v.x * sin_a + v.y * cos_a
            transformed.append(Vector2D(self.pos.x + rx, self.pos.y + ry))
        return transformed

    def support(self, direction):
        verts = self.get_transformed_vertices()
        best_point = verts[0]
        best_dot = best_point.dot(direction)
        for v in verts[1:]:
            d = v.dot(direction)
            if d > best_dot:
                best_dot = d
                best_point = v
        return best_point

    def kinetic_energy(self):
        if self.is_static: return 0.0
        trans_ke = 0.5 * self.mass * self.linear_vel.length_sq()
        rot_ke = 0.5 * self.inertia * (self.angular_vel ** 2)
        return trans_ke + rot_ke

def support_minkowski(body_a, body_b, direction):
    s_a = body_a.support(direction)
    s_b = body_b.support(direction.neg())
    return s_a - s_b

def gjk_2d(body_a, body_b):
    dir = (body_b.pos - body_a.pos).normalize()
    if dir.length_sq() == 0: dir = Vector2D(1, 0)

    simplex = [support_minkowski(body_a, body_b, dir)]
    dir = simplex[0].neg()

    while True:
        a = support_minkowski(body_a, body_b, dir)
        if a.dot(dir) < 0:
            return False, []

        simplex.append(a)

        if len(simplex) == 2:
            b, a = simplex[0], simplex[1]
            ab, ao = b - a, a.neg()
            dir = ab.perpendicular()
            if dir.dot(ao) < 0: dir = dir.neg()
        elif len(simplex) == 3:
            c, b, a = simplex[0], simplex[1], simplex[2]
            ab, ac, ao = b - a, c - a, a.neg()
            ab_perp = ab.perpendicular()
            if ab_perp.dot(ac) > 0: ab_perp = ab_perp.neg()

            ac_perp = ac.perpendicular()
            if ac_perp.dot(ab) > 0: ac_perp = ac_perp.neg()

            if ab_perp.dot(ao) > 0:
                simplex.remove(c)
                dir = ab_perp
            elif ac_perp.dot(ao) > 0:
                simplex.remove(b)
                dir = ac_perp
            else:
                return True, simplex

def epa_2d(body_a, body_b, simplex):
    poly = list(simplex)
    for _ in range(32):
        min_dist = float('inf')
        min_idx = 0
        normal = Vector2D(0, 0)

        for i in range(len(poly)):
            j = (i + 1) % len(poly)
            a, b = poly[i], poly[j]
            edge = b - a
            n = edge.perpendicular().normalize()
            d = n.dot(a)
            if d < 0:
                d, n = -d, n.neg()

            if d < min_dist:
                min_dist, min_idx, normal = d, j, n

        p = support_minkowski(body_a, body_b, normal)
        d = p.dot(normal)

        if abs(d - min_dist) < 1e-4:
            return normal, min_dist

        poly.insert(min_idx, p)

    return normal, min_dist

class PhysicsWorld:
    def __init__(self, gravity=Vector2D(0, 981.0)):
        self.bodies = []
        self.gravity = gravity

    def add_body(self, body):
        self.bodies.append(body)

    def step(self, dt):
        for b in self.bodies:
            if not b.is_static:
                b.linear_vel = b.linear_vel + self.gravity * dt

        collisions = 0
        for i in range(len(self.bodies)):
            for j in range(i + 1, len(self.bodies)):
                b1, b2 = self.bodies[i], self.bodies[j]
                if b1.is_static and b2.is_static: continue

                hit, simplex = gjk_2d(b1, b2)
                if hit:
                    collisions += 1
                    normal, depth = epa_2d(b1, b2, simplex)

                    total_inv = b1.inv_mass + b2.inv_mass
                    if total_inv > 0:
                        corr = normal * (depth / total_inv)
                        if not b1.is_static: b1.pos = b1.pos - corr * b1.inv_mass
                        if not b2.is_static: b2.pos = b2.pos + corr * b2.inv_mass

                    rv = b2.linear_vel - b1.linear_vel
                    vel_along_normal = rv.dot(normal)
                    if vel_along_normal < 0:
                        e = min(b1.restitution, b2.restitution)
                        j_mag = -(1.0 + e) * vel_along_normal / total_inv
                        impulse = normal * j_mag
                        if not b1.is_static: b1.linear_vel = b1.linear_vel - impulse * b1.inv_mass
                        if not b2.is_static: b2.linear_vel = b2.linear_vel + impulse * b2.inv_mass

        for b in self.bodies:
            if not b.is_static:
                b.pos = b.pos + b.linear_vel * dt
                b.angle += b.angular_vel * dt

        return collisions

    def total_kinetic_energy(self):
        return sum(b.kinetic_energy() for b in self.bodies)

    def total_momentum(self):
        px = sum(b.mass * b.linear_vel.x for b in self.bodies if not b.is_static)
        py = sum(b.mass * b.linear_vel.y for b in self.bodies if not b.is_static)
        return Vector2D(px, py)

def run_headless_simulation(args):
    world = PhysicsWorld()

    ground_verts = [Vector2D(-400, -20), Vector2D(400, -20), Vector2D(400, 20), Vector2D(-400, 20)]
    ground = RigidBody(Vector2D(400, 500), ground_verts, is_static=True)
    world.add_body(ground)

    box_verts = [Vector2D(-20, -20), Vector2D(20, -20), Vector2D(20, 20), Vector2D(-20, 20)]
    for k in range(args.boxes):
        box = RigidBody(Vector2D(400, 400 - (k * 45)), box_verts, mass=2.0)
        world.add_body(box)

    print(f"=== Starting Headless Physics Test Harness ===")
    print(f"Bodies: {len(world.bodies)} | Step: {args.dt:.4f}s | Duration: {args.duration:.2f}s | Output: {args.output or 'Console Only'}\n")

    steps = int(args.duration / args.dt)
    csv_writer = None
    csv_file = None

    if args.output:
        csv_file = open(args.output, 'w', newline='')
        csv_writer = csv.writer(csv_file)
        csv_writer.writerow(["step", "time_sec", "kinetic_energy", "momentum_x", "momentum_y", "collisions"])

    start_wall_time = time.time()

    for s in range(steps):
        t_sim = s * args.dt
        col_count = world.step(args.dt)
        ke = world.total_kinetic_energy()
        mom = world.total_momentum()

        if csv_writer:
            csv_writer.writerow([s, f"{t_sim:.4f}", f"{ke:.6f}", f"{mom.x:.6f}", f"{mom.y:.6f}", col_count])

        if s % args.log_interval == 0 or s == steps - 1:
            print(f"Step {s:04d} | Time: {t_sim:6.2f}s | KE: {ke:10.2f} J | Momentum: ({mom.x:8.1f}, {mom.y:8.1f}) | Active Collisions: {col_count}")

    elapsed = time.time() - start_wall_time
    if csv_file:
        csv_file.close()

    print(f"\n[SUMMARY] Executed {steps} steps in {elapsed:.3f}s real-time ({steps / elapsed:.1f} FPS equivalent).")

def main():
    parser = argparse.ArgumentParser(description="Headless Physics Engine CLI Test Runner")
    parser.add_argument("--duration", type=float, default=3.0, help="Simulation time in seconds (default: 3.0)")
    parser.add_argument("--dt", type=float, default=0.016, help="Timestep delta in seconds (default: 0.016)")
    parser.add_argument("--boxes", type=int, default=5, help="Number of stacked test boxes (default: 5)")
    parser.add_argument("--log-interval", type=int, default=20, help="Interval of steps to print to console (default: 20)")
    parser.add_argument("--output", type=str, default="physics_stats.csv", help="CSV log filename (default: physics_stats.csv)")

    args = parser.parse_args()
    run_headless_simulation(args)

if __name__ == "__main__":
    main()
