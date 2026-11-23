#!/bin/sh
SHOP=/tmp/shop
rm -rf "$SHOP"
mkdir -p "$SHOP"
cd "$SHOP"

cat > cart.py <<'EOF'
def cart_total(items):
    return sum(i["price"] * i["qty"] + i.get("fee", 0) for i in items)
EOF

cat > test_cart.py <<'EOF'
import unittest
from cart import cart_total


class CartTotal(unittest.TestCase):
    def test_skips_zero_qty(self):
        self.assertEqual(cart_total([{"price": 5, "qty": 0, "fee": 2}]), 0)

    def test_sums(self):
        self.assertEqual(cart_total([{"price": 5, "qty": 2}]), 10)
EOF

git init -q
git -c user.name=you -c user.email=you@example.com add -A
git -c user.name=you -c user.email=you@example.com commit -qm "Seed products"
git -c user.name=you -c user.email=you@example.com commit -q --allow-empty -m "Add cart page"
git -c user.name=you -c user.email=you@example.com commit -q --allow-empty -m "Count fees in totals"
