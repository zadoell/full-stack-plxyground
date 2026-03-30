#!/usr/bin/env bash
# deploy-cli.sh — Deploy or update the PLXYGROUND CloudFormation stack
# Usage: bash infrastructure/cloudformation/deploy-cli.sh
# Prerequisites: AWS CLI configured (aws configure), KeyPair already created in AWS console

set -euo pipefail

STACK_NAME="plxyground-production"
TEMPLATE_FILE="$(dirname "$0")/plxyground-stack.yml"
REGION="${AWS_REGION:-eu-west-1}"

echo "=== PLXYGROUND CloudFormation Deploy ==="
echo "Stack:  $STACK_NAME"
echo "Region: $REGION"
echo ""

# Prompt for secrets not safe to put in git
read -rp "EC2 Key Pair name (from AWS console): " KEY_NAME
read -rsp "RDS master password (min 16 chars, alphanumeric + !#\$%^&*): " DB_PASSWORD; echo
read -rsp "JWT secret (min 32 chars): " JWT_SECRET; echo
read -rsp "Seed admin password (min 12 chars): " SEED_ADMIN_PW; echo
read -rp  "CORS origin (e.g. https://app.plxyground.com): " CORS_ORIGIN
read -rsp "Resend API key (or press enter to skip): " RESEND_KEY; echo
read -rp  "Resend from email [noreply@plxyground.com]: " RESEND_FROM
RESEND_FROM="${RESEND_FROM:-noreply@plxyground.com}"

echo ""
echo "Deploying stack... (this takes ~10-15 minutes on first run)"

aws cloudformation deploy \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE_FILE" \
  --region "$REGION" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    KeyName="$KEY_NAME" \
    DBPassword="$DB_PASSWORD" \
    JwtSecret="$JWT_SECRET" \
    SeedAdminPassword="$SEED_ADMIN_PW" \
    CorsOrigin="$CORS_ORIGIN" \
    ResendApiKey="${RESEND_KEY:-}" \
    ResendFromEmail="$RESEND_FROM" \
  --tags \
    App=plxyground \
    Environment=production

echo ""
echo "=== Stack deployed successfully! ==="
echo ""
echo "Outputs:"
aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs" \
  --output table

echo ""
echo "Next steps:"
echo "  1. Point your DNS A record to the EC2PublicIP shown above"
echo "  2. SSH to the instance: ssh -i ~/.ssh/<your-key>.pem ec2-user@<EC2PublicIP>"
echo "  3. Push your code and deploy: bash infrastructure/cloudformation/https-setup.sh"
echo "  4. Run migrations: DATABASE_URL=... npm run migrate"
