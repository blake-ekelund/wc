import { createClient } from "@/utils/supabase/client";
import type { Contact, Task, Touchpoint, StageDefinition, Vendor, VendorContact, VendorNote, VendorContract, VendorTax } from "@/components/demo/data";
import type { TeamMember } from "@/components/demo/demo-app";
import type { EmailTemplate } from "@/components/demo/email-templates";

// =============================================
// Types matching Supabase schema
// =============================================
export interface WorkspaceData {
  workspace: {
    id: string;
    name: string;
    industry: string | null;
    plan: string;
  };
  userRole: "owner" | "admin" | "manager" | "member";
  userName: string;
  userEmail: string;
  contacts: Contact[];
  tasks: Task[];
  touchpoints: Touchpoint[];
  stages: StageDefinition[];
  teamMembers: TeamMember[];
  customFields: { id: string; label: string; type: "text" | "number" | "date" | "select"; options?: string[] }[];
  customFieldValues: Record<string, Record<string, string>>;
  alertSettings: {
    staleDays: number;
    atRiskTouchpoints: number;
    highValueThreshold: number;
    overdueAlerts: boolean;
    todayAlerts: boolean;
    negotiationAlerts: boolean;
    staleContactAlerts: boolean;
    atRiskAlerts: boolean;
  };
  emailTemplates: EmailTemplate[];
  dashboardKpis: string[];
  emailSignature: string;
  workspaceId: string;
  vendors?: Vendor[];
  vendorContacts?: VendorContact[];
  vendorNotes?: VendorNote[];
  vendorContracts?: VendorContract[];
  vendorTaxRecords?: VendorTax[];
}

// =============================================
// Fetch all workspace data
// =============================================
export async function fetchWorkspaceData(workspaceId: string, userId: string): Promise<WorkspaceData | null> {
  const supabase = createClient();

  // Fetch workspace
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, industry, plan")
    .eq("id", workspaceId)
    .single();

  if (!workspace) return null;

  // Fetch membership for current user
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role, owner_label")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (!membership) return null;

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  // Fetch user auth info for email
  const { data: { user } } = await supabase.auth.getUser();

  // Parallel fetches
  const [contactsRes, tasksRes, touchpointsRes, stagesRes, membersRes, fieldsRes, fieldValuesRes, alertsRes, templatesRes, vendorsRes, vendorContactsRes, vendorNotesRes, vendorContractsRes, vendorTaxRes, vendorTaxYearsRes] = await Promise.all([
    supabase.from("contacts").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
    supabase.from("tasks").select("*").eq("workspace_id", workspaceId).order("due", { ascending: true }),
    supabase.from("touchpoints").select("*").eq("workspace_id", workspaceId).order("date", { ascending: false }),
    supabase.from("pipeline_stages").select("*").eq("workspace_id", workspaceId).order("sort_order"),
    supabase.from("workspace_members").select("*").eq("workspace_id", workspaceId),
    supabase.from("custom_fields").select("*").eq("workspace_id", workspaceId).order("sort_order"),
    supabase.from("custom_field_values").select("*").eq("workspace_id", workspaceId),
    supabase.from("alert_settings").select("*").eq("workspace_id", workspaceId).single(),
    supabase.from("email_templates").select("*").eq("workspace_id", workspaceId).order("sort_order"),
    supabase.from("vendors").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
    supabase.from("vendor_contacts").select("*").eq("workspace_id", workspaceId),
    supabase.from("vendor_notes").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
    supabase.from("vendor_contracts").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
    supabase.from("vendor_tax_records").select("*").eq("workspace_id", workspaceId),
    supabase.from("vendor_tax_year_records").select("*").eq("workspace_id", workspaceId),
  ]);

  // Map Supabase contacts to app Contact type
  const contacts: Contact[] = (contactsRes.data || []).map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    company: c.company,
    role: c.role,
    avatar: c.avatar,
    avatarColor: c.avatar_color,
    stage: c.stage,
    value: Number(c.value),
    owner: c.owner_label,
    lastContact: c.last_contact || "",
    created: c.created_at?.slice(0, 10) || "",
    tags: c.tags || [],
    archived: c.archived || false,
    trashedAt: c.trashed_at || undefined,
    stageChangedAt: c.stage_changed_at || undefined,
    billingAddress: c.billing_street1 ? {
      street1: c.billing_street1 || "",
      street2: c.billing_street2 || undefined,
      city: c.billing_city || "",
      state: c.billing_state || "",
      zip: c.billing_zip || "",
      country: c.billing_country || undefined,
    } : undefined,
    shippingAddress: c.shipping_street1 ? {
      street1: c.shipping_street1 || "",
      street2: c.shipping_street2 || undefined,
      city: c.shipping_city || "",
      state: c.shipping_state || "",
      zip: c.shipping_zip || "",
      country: c.shipping_country || undefined,
    } : undefined,
    shippingSameAsBilling: c.shipping_same_as_billing || false,
    website: c.website || undefined,
    source: c.source || undefined,
    notes: c.notes || undefined,
  }));

  // Map Supabase tasks to app Task type
  const tasks: Task[] = (tasksRes.data || []).map((t) => ({
    id: t.id,
    contactId: t.contact_id || "",
    title: t.title,
    description: t.description || undefined,
    due: t.due || "",
    owner: t.owner_label,
    completed: t.completed,
    completedAt: t.completed_at || undefined,
    priority: t.priority as "high" | "medium" | "low",
  }));

  // Map Supabase touchpoints to app Touchpoint type
  const touchpoints: Touchpoint[] = (touchpointsRes.data || []).map((tp) => ({
    id: tp.id,
    contactId: tp.contact_id || "",
    type: tp.type as "call" | "email" | "meeting" | "note",
    title: tp.title,
    description: tp.description,
    date: tp.date,
    owner: tp.owner_label,
  }));

  // Map pipeline stages
  const stages: StageDefinition[] = (stagesRes.data || []).map((s) => ({
    label: s.label,
    color: s.color,
    bgColor: s.bg_color,
  }));

  // Map team members
  const avatarColors = ["bg-accent", "bg-emerald-500", "bg-violet-500", "bg-pink-500", "bg-sky-500", "bg-amber-500", "bg-indigo-500", "bg-teal-500"];
  const teamMembers: TeamMember[] = (membersRes.data || []).map((m, i) => {
    const memberProfile = m.user_id === userId ? profile : null;
    const name = m.user_id === userId ? (profile?.full_name || "You") : (m.owner_label || `Team Member ${i + 1}`);
    const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
    return {
      id: m.id,
      name,
      email: m.invited_email || (m.user_id === userId ? (user?.email || "") : ""),
      role: m.role === "owner" ? "admin" : m.role,
      avatar: initials,
      avatarColor: avatarColors[i % avatarColors.length],
      status: m.status as "active" | "pending",
      ownerLabel: m.owner_label,
      reportsTo: m.reports_to || undefined,
    };
  });

  // Map custom fields
  const customFields = (fieldsRes.data || []).map((f) => ({
    id: f.id,
    label: f.label,
    type: f.field_type as "text" | "number" | "date" | "select",
    options: f.options || undefined,
  }));

  // Map custom field values (contactId → fieldId → value)
  const customFieldValues: Record<string, Record<string, string>> = {};
  (fieldValuesRes.data || []).forEach((v) => {
    if (!customFieldValues[v.contact_id]) customFieldValues[v.contact_id] = {};
    customFieldValues[v.contact_id][v.field_id] = v.value;
  });

  // Map alert settings
  const alerts = alertsRes.data;
  const alertSettings = {
    staleDays: alerts?.stale_days ?? 14,
    atRiskTouchpoints: alerts?.at_risk_touchpoints ?? 1,
    highValueThreshold: alerts?.high_value_threshold ?? 10000,
    overdueAlerts: alerts?.overdue_alerts ?? true,
    todayAlerts: alerts?.today_alerts ?? true,
    negotiationAlerts: alerts?.negotiation_alerts ?? true,
    staleContactAlerts: alerts?.stale_contact_alerts ?? true,
    atRiskAlerts: alerts?.at_risk_alerts ?? true,
  };

  // Map email templates
  const emailTemplates: EmailTemplate[] = (templatesRes.data || []).map((t) => ({
    id: t.id,
    name: t.name,
    subject: t.subject,
    body: t.body,
    category: t.category as EmailTemplate["category"],
  }));

  // Map vendors
  const vendorsData: Vendor[] = (vendorsRes.data || []).map((v) => ({
    id: v.id,
    name: v.name,
    category: v.category || "",
    status: v.status as "active" | "inactive" | "pending",
    website: v.website || undefined,
    phone: v.phone || undefined,
    email: v.email || undefined,
    notes: v.notes || undefined,
    owner: v.owner_label || "You",
    created: v.created_at ? new Date(v.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
    contractStart: v.contract_start || undefined,
    contractEnd: v.contract_end || undefined,
    contractTerm: v.contract_term || undefined,
    autoRenew: v.auto_renew || false,
    payFrequency: v.pay_frequency || undefined,
    payAmount: v.pay_amount ? Number(v.pay_amount) : undefined,
    annualAmount: v.annual_amount ? Number(v.annual_amount) : undefined,
    taxClassification: v.tax_classification || undefined,
    trashedAt: v.trashed_at || undefined,
  }));

  // Map vendor contacts
  const vendorContactsData: VendorContact[] = (vendorContactsRes.data || []).map((c) => ({
    id: c.id,
    vendorId: c.vendor_id,
    name: c.name,
    email: c.email || undefined,
    phone: c.phone || undefined,
    role: c.role || "",
    isPrimary: c.is_primary || false,
  }));

  // Map vendor notes
  const vendorNotesData: VendorNote[] = (vendorNotesRes.data || []).map((n) => ({
    id: n.id,
    vendorId: n.vendor_id,
    title: n.title,
    description: n.description || "",
    date: n.date ? new Date(n.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
    owner: n.owner_label || "You",
  }));

  // Map vendor contracts
  const vendorContractsData: VendorContract[] = (vendorContractsRes.data || []).map((c) => ({
    id: c.id,
    vendorId: c.vendor_id,
    title: c.title,
    type: c.type as VendorContract["type"],
    status: c.status as VendorContract["status"],
    startDate: c.start_date || undefined,
    endDate: c.end_date || undefined,
    value: c.value ? Number(c.value) : undefined,
    autoRenew: c.auto_renew || false,
    notes: c.notes || undefined,
    created: c.created_at || "",
  }));

  // Map vendor tax records + year records
  const yearRecordsMap: Record<string, VendorTax["yearRecords"]> = {};
  (vendorTaxYearsRes.data || []).forEach((yr) => {
    if (!yearRecordsMap[yr.vendor_id]) yearRecordsMap[yr.vendor_id] = [];
    yearRecordsMap[yr.vendor_id].push({
      year: yr.tax_year,
      status: yr.status as "sent" | "not-sent",
      totalPaid: Number(yr.total_paid),
    });
  });

  const vendorTaxData: VendorTax[] = (vendorTaxRes.data || []).map((t) => ({
    id: t.id,
    vendorId: t.vendor_id,
    w9Status: t.w9_status as VendorTax["w9Status"],
    needs1099: t.needs_1099 || false,
    type1099: t.type_1099 as VendorTax["type1099"] || undefined,
    yearRecords: yearRecordsMap[t.vendor_id] || [],
  }));

  return {
    workspace: { id: workspace.id, name: workspace.name, industry: workspace.industry, plan: workspace.plan || "free" },
    userRole: membership.role as WorkspaceData["userRole"],
    userName: profile?.full_name || "",
    userEmail: user?.email || "",
    contacts,
    tasks,
    touchpoints,
    stages,
    teamMembers,
    customFields,
    customFieldValues,
    alertSettings,
    emailTemplates,
    dashboardKpis: (workspace as Record<string, unknown>).dashboard_kpis as string[] || [],
    emailSignature: (profile as Record<string, unknown>)?.email_signature as string || "",
    workspaceId,
    vendors: vendorsData,
    vendorContacts: vendorContactsData,
    vendorNotes: vendorNotesData,
    vendorContracts: vendorContractsData,
    vendorTaxRecords: vendorTaxData,
  };
}

// =============================================
// CRUD operations — sync back to Supabase
// =============================================
export function createSupabaseSyncCallbacks(workspaceId: string) {
  const supabase = createClient();

  return {
    // CONTACTS
    async saveContact(contact: Contact) {
      const { error } = await supabase.from("contacts").upsert({
        id: contact.id,
        workspace_id: workspaceId,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        role: contact.role,
        avatar: contact.avatar,
        avatar_color: contact.avatarColor,
        stage: contact.stage,
        value: contact.value,
        owner_label: contact.owner,
        tags: contact.tags,
        last_contact: contact.lastContact || null,
        archived: contact.archived || false,
        trashed_at: contact.trashedAt || null,
        stage_changed_at: contact.stageChangedAt || null,
        billing_street1: contact.billingAddress?.street1 || null,
        billing_street2: contact.billingAddress?.street2 || null,
        billing_city: contact.billingAddress?.city || null,
        billing_state: contact.billingAddress?.state || null,
        billing_zip: contact.billingAddress?.zip || null,
        billing_country: contact.billingAddress?.country || null,
        shipping_street1: contact.shippingAddress?.street1 || null,
        shipping_street2: contact.shippingAddress?.street2 || null,
        shipping_city: contact.shippingAddress?.city || null,
        shipping_state: contact.shippingAddress?.state || null,
        shipping_zip: contact.shippingAddress?.zip || null,
        shipping_country: contact.shippingAddress?.country || null,
        shipping_same_as_billing: contact.shippingSameAsBilling || false,
        website: contact.website || null,
        source: contact.source || null,
        notes: contact.notes || null,
      });
      if (error) console.error("Save contact error:", error);
    },

    async deleteContact(id: string) {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) console.error("Delete contact error:", error);
    },

    // TASKS
    async saveTask(task: Task) {
      const { error } = await supabase.from("tasks").upsert({
        id: task.id,
        workspace_id: workspaceId,
        contact_id: task.contactId || null,
        title: task.title,
        description: task.description || null,
        due: task.due || null,
        owner_label: task.owner,
        completed: task.completed,
        completed_at: task.completedAt || null,
        priority: task.priority,
      });
      if (error) console.error("Save task error:", error);
    },

    async deleteTask(id: string) {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) console.error("Delete task error:", error);
    },

    // TOUCHPOINTS
    async saveTouchpoint(tp: Touchpoint) {
      const { error } = await supabase.from("touchpoints").upsert({
        id: tp.id,
        workspace_id: workspaceId,
        contact_id: tp.contactId || null,
        type: tp.type,
        title: tp.title,
        description: tp.description,
        date: tp.date,
        owner_label: tp.owner,
      });
      if (error) console.error("Save touchpoint error:", error);
    },

    async deleteTouchpoint(id: string) {
      const { error } = await supabase.from("touchpoints").delete().eq("id", id);
      if (error) console.error("Delete touchpoint error:", error);
    },

    // PIPELINE STAGES
    async saveStages(stages: StageDefinition[]) {
      // Delete existing and re-insert
      await supabase.from("pipeline_stages").delete().eq("workspace_id", workspaceId);
      const inserts = stages.map((s, i) => ({
        workspace_id: workspaceId,
        label: s.label,
        color: s.color,
        bg_color: s.bgColor,
        sort_order: i,
      }));
      const { error } = await supabase.from("pipeline_stages").insert(inserts);
      if (error) console.error("Save stages error:", error);
    },

    // WORKSPACE
    async saveWorkspaceName(name: string) {
      const { error } = await supabase.from("workspaces").update({ name }).eq("id", workspaceId);
      if (error) console.error("Save workspace name error:", error);
    },

    // ALERT SETTINGS
    async saveAlertSettings(settings: WorkspaceData["alertSettings"]) {
      // Try update first (row should already exist from onboarding)
      const { error: updateError } = await supabase
        .from("alert_settings")
        .update({
          stale_days: settings.staleDays,
          at_risk_touchpoints: settings.atRiskTouchpoints,
          high_value_threshold: settings.highValueThreshold,
          overdue_alerts: settings.overdueAlerts,
          today_alerts: settings.todayAlerts,
          negotiation_alerts: settings.negotiationAlerts,
          stale_contact_alerts: settings.staleContactAlerts,
          at_risk_alerts: settings.atRiskAlerts,
        })
        .eq("workspace_id", workspaceId);

      if (updateError) {
        // If update fails (no row), insert
        const { error: insertError } = await supabase
          .from("alert_settings")
          .insert({
            workspace_id: workspaceId,
            stale_days: settings.staleDays,
            at_risk_touchpoints: settings.atRiskTouchpoints,
            high_value_threshold: settings.highValueThreshold,
            overdue_alerts: settings.overdueAlerts,
            today_alerts: settings.todayAlerts,
            negotiation_alerts: settings.negotiationAlerts,
            stale_contact_alerts: settings.staleContactAlerts,
            at_risk_alerts: settings.atRiskAlerts,
          });
        if (insertError) console.error("Save alert settings error:", insertError);
      }
    },

    // CUSTOM FIELDS
    async saveCustomField(field: { id: string; label: string; type: string; options?: string[] }) {
      const { error } = await supabase.from("custom_fields").upsert({
        id: field.id,
        workspace_id: workspaceId,
        label: field.label,
        field_type: field.type,
        options: field.options || null,
      });
      if (error) console.error("Save custom field error:", error);
    },

    async deleteCustomField(id: string) {
      await supabase.from("custom_field_values").delete().eq("field_id", id);
      const { error } = await supabase.from("custom_fields").delete().eq("id", id);
      if (error) console.error("Delete custom field error:", error);
    },

    // CUSTOM FIELD VALUES
    async saveCustomFieldValue(contactId: string, fieldId: string, value: string) {
      const { error } = await supabase.from("custom_field_values").upsert({
        workspace_id: workspaceId,
        contact_id: contactId,
        field_id: fieldId,
        value,
      }, { onConflict: "contact_id,field_id" });
      if (error) console.error("Save custom field value error:", error);
    },

    // TEAM MEMBERS
    async saveTeamMembers(members: TeamMember[]) {
      // We only update existing members (role, reports_to, owner_label)
      for (const m of members) {
        await supabase.from("workspace_members").update({
          role: m.role,
          owner_label: m.ownerLabel,
          reports_to: m.reportsTo || null,
        }).eq("id", m.id);
      }
    },

    // EMAIL TEMPLATES
    async saveEmailTemplate(template: EmailTemplate) {
      const { error } = await supabase.from("email_templates").upsert({
        id: template.id,
        workspace_id: workspaceId,
        name: template.name,
        subject: template.subject,
        body: template.body,
        category: template.category,
      });
      if (error) console.error("Save email template error:", error);
    },

    async deleteEmailTemplate(id: string) {
      const { error } = await supabase.from("email_templates").delete().eq("id", id);
      if (error) console.error("Delete email template error:", error);
    },

    async saveAllEmailTemplates(templates: EmailTemplate[]) {
      // Delete all existing, then insert fresh
      await supabase.from("email_templates").delete().eq("workspace_id", workspaceId);
      if (templates.length > 0) {
        const { error } = await supabase.from("email_templates").insert(
          templates.map((t, i) => ({
            id: t.id,
            workspace_id: workspaceId,
            name: t.name,
            subject: t.subject,
            body: t.body,
            category: t.category,
            sort_order: i,
          }))
        );
        if (error) console.error("Save all email templates error:", error);
      }
    },

    // EMAIL SIGNATURE
    async saveSignature(signature: string) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ email_signature: signature })
        .eq("id", user.id);
      if (error) console.error("Save signature error:", error);
    },

    // VENDORS
    async saveVendor(vendor: Vendor) {
      const { error } = await supabase.from("vendors").upsert({
        id: vendor.id,
        workspace_id: workspaceId,
        name: vendor.name,
        category: vendor.category,
        status: vendor.status,
        website: vendor.website || null,
        phone: vendor.phone || null,
        email: vendor.email || null,
        notes: vendor.notes || null,
        owner_label: vendor.owner,
        contract_start: vendor.contractStart || null,
        contract_end: vendor.contractEnd || null,
        contract_term: vendor.contractTerm || null,
        auto_renew: vendor.autoRenew || false,
        pay_frequency: vendor.payFrequency || null,
        pay_amount: vendor.payAmount || null,
        annual_amount: vendor.annualAmount || null,
        tax_classification: vendor.taxClassification || null,
        trashed_at: vendor.trashedAt || null,
      });
      if (error) console.error("Save vendor error:", error);
    },
    async deleteVendor(id: string) {
      const { error } = await supabase.from("vendors").delete().eq("id", id).eq("workspace_id", workspaceId);
      if (error) console.error("Delete vendor error:", error);
    },
    async saveVendorContact(contact: VendorContact) {
      const { error } = await supabase.from("vendor_contacts").upsert({
        id: contact.id,
        workspace_id: workspaceId,
        vendor_id: contact.vendorId,
        name: contact.name,
        email: contact.email || null,
        phone: contact.phone || null,
        role: contact.role,
        is_primary: contact.isPrimary,
      });
      if (error) console.error("Save vendor contact error:", error);
    },
    async deleteVendorContact(id: string) {
      const { error } = await supabase.from("vendor_contacts").delete().eq("id", id);
      if (error) console.error("Delete vendor contact error:", error);
    },
    async saveVendorNote(note: VendorNote) {
      const { error } = await supabase.from("vendor_notes").upsert({
        id: note.id,
        workspace_id: workspaceId,
        vendor_id: note.vendorId,
        title: note.title,
        description: note.description,
        date: note.date,
        owner_label: note.owner,
      });
      if (error) console.error("Save vendor note error:", error);
    },
    async deleteVendorNote(id: string) {
      const { error } = await supabase.from("vendor_notes").delete().eq("id", id);
      if (error) console.error("Delete vendor note error:", error);
    },
    async saveVendorContract(contract: VendorContract) {
      const { error } = await supabase.from("vendor_contracts").upsert({
        id: contract.id,
        workspace_id: workspaceId,
        vendor_id: contract.vendorId,
        title: contract.title,
        type: contract.type,
        status: contract.status,
        start_date: contract.startDate || null,
        end_date: contract.endDate || null,
        value: contract.value || null,
        auto_renew: contract.autoRenew || false,
        notes: contract.notes || null,
      });
      if (error) console.error("Save vendor contract error:", error);
    },
    async deleteVendorContract(id: string) {
      const { error } = await supabase.from("vendor_contracts").delete().eq("id", id);
      if (error) console.error("Delete vendor contract error:", error);
    },
    async saveVendorTax(tax: VendorTax) {
      // Upsert the main tax record
      // First try to find existing record
      const { data: existing } = await supabase
        .from("vendor_tax_records")
        .select("id")
        .eq("vendor_id", tax.vendorId)
        .single();

      const taxPayload = {
        workspace_id: workspaceId,
        vendor_id: tax.vendorId,
        w9_status: tax.w9Status,
        needs_1099: tax.needs1099,
        type_1099: tax.needs1099 ? (tax.type1099 || null) : null,
      };

      const { error } = existing
        ? await supabase.from("vendor_tax_records").update(taxPayload).eq("id", existing.id)
        : await supabase.from("vendor_tax_records").insert(taxPayload);
      if (error) console.error("Save vendor tax error:", error);

      // Upsert year records into separate table
      if (tax.yearRecords?.length) {
        for (const yr of tax.yearRecords) {
          const { error: yrError } = await supabase.from("vendor_tax_year_records").upsert({
            workspace_id: workspaceId,
            vendor_id: tax.vendorId,
            tax_year: yr.year,
            status: yr.status,
            total_paid: yr.totalPaid,
          }, { onConflict: "vendor_id,tax_year" });
          if (yrError) console.error("Save vendor tax year error:", yrError);
        }
      }
    },

    // DASHBOARD KPIs
    async saveDashboardKpis(kpiIds: string[]) {
      const { error } = await supabase
        .from("workspaces")
        .update({ dashboard_kpis: kpiIds })
        .eq("id", workspaceId);
      if (error) console.error("Save dashboard KPIs error:", error);
    },
  };
}
