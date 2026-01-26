# 📋 قائمة Migrations السريعة

## الملفات المنظمة (001-037)

### 🏗️ البنية الأساسية (001-006)
- **001** → `core_infrastructure` - RBAC + Organizations + Audit
- **002** → `business_entities` - Members, Companies, Employers
- **003** → `medical_and_pricing` - Medical Services & Pricing
- **004** → `claims_and_approvals` - Claims, Policies, Pre-Auth
- **005** → `supporting_tables` - Import Logs, Errors
- **006** → `indexes_and_constraints` - FK, Indexes, Constraints

### 🔐 الأمان (007-010)
- **007** → `fix_super_admin_employer_permissions`
- **008** → `fix_security_tables_alignment`
- **009** → `align_password_reset_tokens`
- **010** → `add_custom_employer_permissions`

### 📎 المرفقات (011-013)
- **011** → `claim_attachments_update`
- **012** → `preauth_attachments`
- **013** → `visit_attachments`

### 🏥 Providers (014, 022-024)
- **014** → `create_legacy_provider_contracts`
- **022** → `add_provider_id_to_users`
- **023** → `add_provider_id_to_claims`
- **024** → `add_network_status_to_providers`

### 🔄 Schema & Pre-Auth (015-017)
- **015** → `comprehensive_schema_alignment`
- **016** → `comprehensive_preauth_alignment`
- **017** → `add_preauth_approval_columns`

### 🏢 Company Settings (018-020)
- **018** → `add_companies_is_default`
- **019** → `add_companies_branding_fields`
- **020** → `fix_company_settings_ui_visibility`

### 🔄 Workflows (021, 026)
- **021** → `unified_visit_workflow`
- **026** → `add_visit_type`

### 🏢 Organizations (025)
- **025** → `add_archived_to_organizations`

### 🆔 Member Identification (027-032)
- **027** → `member_identification_system` - barcode, nationalNumber
- **028** → `make_birth_date_gender_optional`
- **029** → `add_card_number_index`
- **030** → `enable_fuzzy_name_search`
- **031** → `add_barcode_index`
- **032** → `radical_member_identity_fix` - Cleanup & Constraints

### 👥 Unified Members ⭐ (033)
- **033** → `unified_member_architecture` - **CRITICAL: Merges family_members into members**

### 🔧 Member Enhancements (034-035)
- **034** → `card_number_sequence`
- **035** → `phase1_optimistic_locking`

### ⏱️ SLA (036)
- **036** → `phase1_sla_tracking`

### 📄 PDF (037)
- **037** → `create_pdf_company_settings`

---

## ⚠️ ملف حرج

**V033** هو نقطة التحول:
- ✅ يدمج family_members في members
- ❌ يحذف جدول family_members نهائيًا
- 🔴 **نقطة لا عودة** - خذ نسخة احتياطية أولاً

---

## 📊 الإحصائيات

| المجموع | المحذوف | المتبقي |
|---------|---------|---------|
| 47      | 10      | **37**  |

---

**آخر تحديث:** 2026-01-12
