#!/bin/bash
# ============================================================
# JanSahayak AI — AWS Lambda Deployment Script
# Uses AWS SAM CLI to build and deploy the FastAPI backend
# ============================================================
# Prerequisites:
#   1. AWS CLI configured: aws configure
#   2. SAM CLI installed: pip install aws-sam-cli
#   3. Docker installed (for sam build)
# ============================================================

set -e  # Exit immediately if any command fails

echo ""
echo "=========================================="
echo "  JanSahayak AI — AWS SAM Deployment"
echo "=========================================="
echo ""

# ── Step 1: Install Python dependencies into ./package directory ──────────────
# This bundles all packages with the Lambda deployment artifact.
echo "[1/3] Installing Python dependencies into ./package..."
pip install -r requirements.txt -t ./package --quiet
echo "      ✅ Dependencies installed."

# ── Step 2: Build the SAM application ─────────────────────────────────────────
# sam build compiles the Lambda function and prepares the deployment artifact.
# Uses the template.yaml in the current directory.
echo ""
echo "[2/3] Building SAM application (sam build)..."
sam build --use-container
echo "      ✅ SAM build complete."

# ── Step 3: Deploy to AWS ──────────────────────────────────────────────────────
# --guided prompts for stack name, region, S3 bucket, etc. on first run.
# On subsequent runs, pass --no-confirm-changeset to skip prompts.
echo ""
echo "[3/3] Deploying to AWS (sam deploy --guided)..."
echo "      You will be prompted for:"
echo "        - Stack Name    (e.g. jansahayak-stack)"
echo "        - AWS Region    (e.g. us-east-1)"
echo "        - Confirm IAM   (Y)"
echo ""
sam deploy --guided

echo ""
echo "=========================================="
echo "  ✅ Deployment Complete!"
echo ""
echo "  Next steps:"
echo "  1. Copy the ApiGatewayUrl from the output above"
echo "  2. Set VITE_API_URL=<ApiGatewayUrl> in frontend/.env.production"
echo "  3. Push frontend to AWS Amplify"
echo "=========================================="
