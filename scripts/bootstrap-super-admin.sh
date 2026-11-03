#!/bin/bash
# CampusVoice Super Admin Bootstrap Script
# Run this ONCE during initial deployment to create the first SUPER_ADMIN account.
# Never create a publicly accessible first-admin registration endpoint.

set -e

echo "=========================================="
echo "CampusVoice Super Admin Bootstrap"
echo "=========================================="

# Check if .env exists
if [ ! -f backend/.env ]; then
    echo "ERROR: backend/.env not found. Copy from .env.example first."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' backend/.env | xargs)

# Validate required variables
if [ -z "$ADMIN_USERNAME" ] || [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
    echo "ERROR: ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be set in .env"
    exit 1
fi

echo "Bootstrapping SUPER_ADMIN account..."
echo "Username: $ADMIN_USERNAME"
echo "Email: $ADMIN_EMAIL"

# Run the bootstrap script
cd backend
npx ts-node src/scripts/bootstrap.ts

echo ""
echo "=========================================="
echo "Super Admin bootstrap complete!"
echo "=========================================="
echo "IMPORTANT SECURITY NOTES:"
echo "1. Change the default password immediately after first login."
echo "2. Never share the ADMIN_PASSWORD from .env"
echo "3. The SUPER_ADMIN is for technical/institutional configuration only"
echo "4. SUPER_ADMIN cannot secretly modify certified election results"
echo "5. All admin actions are recorded in the audit log"
echo "=========================================="
