#!/usr/bin/env python3
"""CLI Physics Simulation Runner."""

import argparse
from scripts.physics import PhysicsWorld, RigidBody, ShapeType, Vec2


def main():
    parser = argparse.ArgumentParser(description="Pure Python Physics Engine Runner")
    parser.add_argument("--gravity", type=float, default=-9.81, help="Gravity along Y-axis")
    parser.add_argument("--restitution", type=float, default=0.8, help="Default bounciness [0.0 - 1.0]")
    parser.add_argument("--slop", type=float, default=0.01, help="Penetration slop threshold")
    parser.add_argument("--percent", type=float, default=0.4, help="Positional correction %% [0.1 - 0.8]")
    parser.add_argument("--steps", type=int, default=100, help="Number of simulation steps")
    args = parser.parse_args()

    world = PhysicsWorld(
        gravity=Vec2(0.0, args.gravity),
        slop=args.slop,
        percent=args.percent,
    )

    ground = RigidBody(0.0, 0.0, mass=0.0, is_static=True, shape_type=ShapeType.BOX, width=20.0, height=2.0)
    ball = RigidBody(x=0.0, y=10.0, mass=1.0, shape_type=ShapeType.CIRCLE, radius=0.5, restitution=args.restitution)

    world.add_body(ground)
    world.add_body(ball)

    print(f"=== PHYSICS SIMULATION (Gravity: {args.gravity}, Restitution: {args.restitution}) ===")
    dt = 0.016
    for step in range(args.steps):
        world.step(dt)
        if step % 10 == 0:
            print(f"Step {step:03d} | Ball Pos: {ball.position} | Ball Vel: {ball.velocity}")


if __name__ == "__main__":
    main()
