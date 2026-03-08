"""
deploy_lambda.py
================
Deploys the jansahayak-ai-gateway Lambda function to AWS.

FIRST TIME SETUP (one time only — 2 minutes):
─────────────────────────────────────────────
1. Go to AWS Console → IAM → Roles → Create Role:
   https://console.aws.amazon.com/iam/home#/roles/create
2. Trusted entity: AWS Service → Lambda → Next
3. Attach permission: AWSLambdaBasicExecutionRole → Next
4. Role name: jansahayak-lambda-role → Create role
5. Click the new role → copy ARN (e.g. arn:aws:iam::889268461649:role/jansahayak-lambda-role)
6. Paste into backend/.env:  LAMBDA_ROLE_ARN=<paste_arn_here>
7. Run: python deploy_lambda.py

SUBSEQUENT RUNS (code update):
─────────────────────────────
Just run: python deploy_lambda.py  (role step is skipped)
"""

import sys
import os
import time
import zipfile
import io

sys.path.insert(0, os.path.dirname(__file__))
from config import settings

import boto3
from botocore.exceptions import ClientError

# ── Config ────────────────────────────────────────────────────────────────────
FUNCTION_NAME = "jansahayak-ai-gateway"
RUNTIME       = "python3.12"
HANDLER       = "lambda_function.lambda_handler"
TIMEOUT       = 30       # seconds
MEMORY_MB     = 256
REGION        = settings.AWS_REGION or "us-east-1"
GEMINI_KEY    = settings.GEMINI_API_KEY
LAMBDA_CODE   = os.path.join(os.path.dirname(__file__), "lambda", "lambda_function.py")


def get_clients():
    kwargs = dict(
        region_name=REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
    return boto3.client("lambda", **kwargs)


def build_zip() -> bytes:
    """Create an in-memory ZIP containing just lambda_function.py."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(LAMBDA_CODE, "lambda_function.py")
    return buf.getvalue()


def get_role_arn() -> str:
    """
    Read LAMBDA_ROLE_ARN from .env / environment.
    The IAM user (ai_for_bharat) does not have iam:CreateRole permission,
    so the role must be created manually once via AWS Console.
    """
    arn = getattr(settings, "LAMBDA_ROLE_ARN", "") or os.environ.get("LAMBDA_ROLE_ARN", "")
    if arn and "arn:aws:iam::" in arn:
        print(f"  [IAM] Role from .env: {arn}")
        return arn

    print("""
  [IAM] LAMBDA_ROLE_ARN not set in .env

  Create the role manually (2 minutes):
  ──────────────────────────────────────────────────────────────────────
  1. Open: https://console.aws.amazon.com/iam/home#/roles/create
  2. Trusted entity type: AWS Service  →  Lambda  →  Next
  3. Add permission policy: AWSLambdaBasicExecutionRole  →  Next
  4. Role name: jansahayak-lambda-role  →  Create role
  5. Click the new role in the list  →  copy the ARN shown at the top
     (looks like: arn:aws:iam::889268461649:role/jansahayak-lambda-role)
  6. Open backend/.env and add:
       LAMBDA_ROLE_ARN=arn:aws:iam::889268461649:role/jansahayak-lambda-role
  7. Run this script again: python deploy_lambda.py
  ──────────────────────────────────────────────────────────────────────
""")
    sys.exit(1)


def deploy():
    print("\n" + "=" * 60)
    print("  JanSahayak AI - Lambda Deployer")
    print(f"  Function : {FUNCTION_NAME}")
    print(f"  Region   : {REGION}")
    print("=" * 60)

    # Pre-flight checks
    if not settings.AWS_ACCESS_KEY_ID or settings.AWS_ACCESS_KEY_ID == "YOUR_AWS_ACCESS_KEY":
        print("\n[ERROR] AWS credentials not set in .env")
        sys.exit(1)
    if not GEMINI_KEY:
        print("\n[ERROR] GEMINI_API_KEY not set in .env")
        sys.exit(1)

    lam = get_clients()

    # Step 1: IAM Role ARN
    print("\n[Step 1] IAM Role...")
    role_arn = get_role_arn()

    # Step 2: Build ZIP
    print("\n[Step 2] Building deployment ZIP...")
    zip_bytes = build_zip()
    print(f"  ZIP size: {len(zip_bytes):,} bytes")

    # Step 3: Create or Update Lambda
    env_vars = {
        "Variables": {
            "GEMINI_API_KEY": GEMINI_KEY,
            "GEMINI_MODEL":   "gemini-2.0-flash",
        }
    }

    try:
        lam.get_function(FunctionName=FUNCTION_NAME)
        exists = True
    except lam.exceptions.ResourceNotFoundException:
        exists = False

    if exists:
        print(f"\n[Step 3] Updating existing Lambda '{FUNCTION_NAME}'...")
        lam.update_function_code(FunctionName=FUNCTION_NAME, ZipFile=zip_bytes)
        time.sleep(3)
        lam.update_function_configuration(
            FunctionName=FUNCTION_NAME,
            Timeout=TIMEOUT,
            MemorySize=MEMORY_MB,
            Environment=env_vars,
        )
        print("  Lambda code + config updated.")
    else:
        print(f"\n[Step 3] Creating Lambda '{FUNCTION_NAME}'...")
        resp = lam.create_function(
            FunctionName=FUNCTION_NAME,
            Runtime=RUNTIME,
            Role=role_arn,
            Handler=HANDLER,
            Code={"ZipFile": zip_bytes},
            Timeout=TIMEOUT,
            MemorySize=MEMORY_MB,
            Environment=env_vars,
            Description="JanSahayak AI Gateway - routes AI requests to Gemini API",
        )
        print(f"  Lambda created: {resp['FunctionArn']}")

    # Final status
    fn  = lam.get_function(FunctionName=FUNCTION_NAME)
    arn = fn["Configuration"]["FunctionArn"]

    print("\n" + "=" * 60)
    print("  DEPLOYMENT SUCCESSFUL")
    print(f"  Lambda ARN : {arn}")
    print(f"  Runtime    : {RUNTIME}  |  Timeout: {TIMEOUT}s  |  Memory: {MEMORY_MB}MB")
    print(f"  Gemini Key : ...{GEMINI_KEY[-8:]}")
    print("=" * 60)
    print(f"\n  Your .env already has: LAMBDA_FUNCTION_NAME={FUNCTION_NAME}")
    print()


if __name__ == "__main__":
    deploy()
