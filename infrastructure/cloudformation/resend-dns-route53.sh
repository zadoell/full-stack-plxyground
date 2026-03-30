#!/usr/bin/env bash
# resend-dns-route53.sh — Add Resend DNS records to Route 53 for email sending
# Run this from your local machine (AWS CLI must be configured).
# Usage: bash infrastructure/cloudformation/resend-dns-route53.sh
#
# Prerequisites:
#   1. A Resend account at https://resend.com
#   2. A domain added to Resend (they'll give you DNS records to add)
#   3. A Route 53 hosted zone for your domain
#   4. AWS CLI configured

set -euo pipefail

read -rp "Your domain (e.g. plxyground.com): " DOMAIN
read -rp "Route 53 Hosted Zone ID (from AWS console): " ZONE_ID

echo ""
echo "=== Resend DNS records for $DOMAIN ==="
echo ""
echo "Log in to https://resend.com/domains, add $DOMAIN, then copy the DNS records shown."
echo "You'll need to enter each record below."
echo ""

# Resend typically provides:
#   - 1 x MX record
#   - 1-2 x TXT records (SPF + DKIM)
#   - 1 x CNAME record (DKIM)

add_record() {
  local rtype="$1"
  local name="$2"
  local value="$3"
  local ttl="${4:-300}"

  # For MX records, value includes priority
  if [ "$rtype" = "MX" ]; then
    CHANGE_BATCH=$(cat <<EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "${name}.",
      "Type": "MX",
      "TTL": ${ttl},
      "ResourceRecords": [{"Value": "${value}"}]
    }
  }]
}
EOF
)
  else
    CHANGE_BATCH=$(cat <<EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "${name}.",
      "Type": "${rtype}",
      "TTL": ${ttl},
      "ResourceRecords": [{"Value": "\"${value}\""}]
    }
  }]
}
EOF
)
  fi

  aws route53 change-resource-record-sets \
    --hosted-zone-id "$ZONE_ID" \
    --change-batch "$CHANGE_BATCH" \
    --output text --query 'ChangeInfo.Status'
}

echo "Enter the SPF TXT record value from Resend (e.g. v=spf1 include:amazonses.com ~all):"
read -r SPF_VALUE
add_record "TXT" "$DOMAIN" "$SPF_VALUE"
echo "  SPF record added."

echo ""
echo "Enter the DKIM CNAME record name from Resend (e.g. resend._domainkey):"
read -r DKIM_NAME
echo "Enter the DKIM CNAME record value from Resend:"
read -r DKIM_VALUE

DKIM_CHANGE=$(cat <<EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "${DKIM_NAME}.${DOMAIN}.",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [{"Value": "${DKIM_VALUE}"}]
    }
  }]
}
EOF
)
aws route53 change-resource-record-sets \
  --hosted-zone-id "$ZONE_ID" \
  --change-batch "$DKIM_CHANGE" \
  --output text --query 'ChangeInfo.Status'
echo "  DKIM CNAME record added."

echo ""
echo "=== DNS records submitted to Route 53 ==="
echo "DNS propagation typically takes 1-5 minutes."
echo "Verify in Resend dashboard: https://resend.com/domains"
