#!/usr/bin/env python3
"""Demo: Off-Center Force & Torque Simulation."""

from scripts.physics import PhysicsWorld, RigidBody, ShapeType, Vec2

def run_rotation_demo():
    world = PhysicsWorld(gravity=Vec2(0.0, -9.81))

    # Static ground
    ground = RigidBody(0.0, 0.0, mass=0.0, is_static=True, shape_type=ShapeType.BOX, width=20.0, height=2.0)
    
    # Off-center dropping ball (hits edge of platform)
    ball = RigidBody(x=1.2, y=8.0, mass=1.0, shape_type=ShapeType.CIRCLE, radius=0.5, restitution=0.8)

    world.add_body(ground)
    world.add_body(ball)

    # Apply off-center force to generate spin
    ball.apply_force_at_point(f=Vec2(50.0, 0.0), point=Vec2(1.2, 8.5))

    print("=== 2D ROTATIONAL DYNAMICS DEMO ===")
    dt = 0.016
    for step in range(100):
        world.step(dt)
        if step % 10 == 0:
            print(
                f"Step {step:03d} | Pos: {ball.position} | "
                f"Angle: {ball.orientation:.2f} rad | AngVel: {ball.angular_velocity:.2f} rad/s"
            )

if __name__ == "__main__":
    run_rotation_demo()
