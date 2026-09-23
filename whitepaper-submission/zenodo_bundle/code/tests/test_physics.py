#!/usr/bin/env python3
"""Unit Tests for Integration, SAT Collisions, and PhysicsWorld Solver."""

import unittest
from scripts.physics import PhysicsWorld, RigidBody, ShapeType, Vec2, collide


class TestPhysicsEngine(unittest.TestCase):

    def test_vector_operations(self):
        v1 = Vec2(3, 4)
        v2 = Vec2(1, 2)
        self.assertAlmostEqual(v1.length(), 5.0)
        self.assertEqual((v1 + v2).x, 4.0)
        self.assertEqual(v1.dot(v2), 11.0)
        self.assertEqual(v1.cross(v2), 2.0)

    def test_freefall_integration(self):
        """Verifies Symplectic Euler trajectory under constant gravity."""
        world = PhysicsWorld(gravity=Vec2(0.0, -10.0))
        body = RigidBody(x=0.0, y=100.0, mass=1.0)
        world.add_body(body)

        dt = 0.1
        world.step(dt) # v = -1.0, y = 99.9
        self.assertAlmostEqual(body.velocity.y, -1.0)
        self.assertAlmostEqual(body.position.y, 99.9)

    def test_circle_collision(self):
        c1 = RigidBody(x=0.0, y=0.0, radius=1.0, shape_type=ShapeType.CIRCLE)
        c2 = RigidBody(x=1.5, y=0.0, radius=1.0, shape_type=ShapeType.CIRCLE)
        
        manifold = collide(c1, c2)
        self.assertIsNotNone(manifold)
        self.assertAlmostEqual(manifold.penetration, 0.5)
        self.assertAlmostEqual(manifold.normal.x, 1.0)

    def test_polygon_sat_collision(self):
        b1 = RigidBody(x=0.0, y=0.0, width=2.0, height=2.0, shape_type=ShapeType.BOX)
        b2 = RigidBody(x=1.5, y=0.0, width=2.0, height=2.0, shape_type=ShapeType.BOX)

        manifold = collide(b1, b2)
        self.assertIsNotNone(manifold)
        self.assertAlmostEqual(manifold.penetration, 0.5)

    def test_impulse_bouncing(self):
        world = PhysicsWorld(gravity=Vec2(0.0, -10.0), slop=0.0)
        ground = RigidBody(x=0.0, y=0.0, is_static=True, shape_type=ShapeType.BOX, width=10.0, height=2.0)
        ball = RigidBody(x=0.0, y=1.2, mass=1.0, shape_type=ShapeType.CIRCLE, radius=0.5, restitution=1.0)
        ball.velocity = Vec2(0.0, -5.0)

        world.add_body(ground)
        world.add_body(ball)
        world.step(0.01)

        # Ball should bounce upward (positive Y velocity)
        self.assertGreater(ball.velocity.y, 0.0)


if __name__ == "__main__":
    unittest.main()
