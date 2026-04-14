"use client";

import { type Contact, type Touchpoint, type Task, type StageDefinition, type Vendor, type VendorContract, type CustomerContract } from "../../data";
import KpiCards from "./kpi-cards";
import TaskSummary from "./task-summary";
import PipelineFunnel from "./pipeline-funnel";
import RecentActivity from "./recent-activity";
import VendorSummary from "./vendor-summary";
import ContractSummary from "./contract-summary";

interface DashboardViewProps {
  contacts: Contact[];
  tasks: Task[];
  touchpoints: Touchpoint[];
  stages: StageDefinition[];
  industryId?: string;
  isLive?: boolean;
  isAdmin?: boolean;
  selectedKpis?: string[];
  onUpdateKpis?: (ids: string[]) => void;
  onSelectContact?: (id: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onNavigate?: (view: any) => void;
  onSelectTask?: (id: string) => void;
  enabledPlugins?: string[];
  vendors?: Vendor[];
  vendorContracts?: VendorContract[];
  customerContracts?: CustomerContract[];
}

export default function DashboardView({
  contacts, tasks, touchpoints, stages, industryId, isLive, isAdmin,
  selectedKpis, onUpdateKpis, onSelectContact, onNavigate, onSelectTask,
  enabledPlugins, vendors, vendorContracts, customerContracts,
}: DashboardViewProps) {
  const plugins = enabledPlugins || [];
  const hasCrm = plugins.includes("crm");
  const hasVendors = plugins.includes("vendors");
  const hasCustomerContracts = (customerContracts?.length ?? 0) > 0 && hasCrm;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl">
      {/* KPI Cards - always visible */}
      <KpiCards
        contacts={contacts}
        tasks={tasks}
        touchpoints={touchpoints}
        stages={stages}
        vendors={vendors}
        vendorContracts={vendorContracts}
        customerContracts={customerContracts}
        enabledPlugins={enabledPlugins}
        selectedKpis={selectedKpis}
        onUpdateKpis={onUpdateKpis}
        isAdmin={isAdmin}
        industryId={industryId}
        isLive={isLive}
      />

      {/* Two-column widget grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <TaskSummary tasks={tasks} onSelectTask={onSelectTask} />
          {hasCrm && (
            <PipelineFunnel contacts={contacts} stages={stages} onSelectContact={onSelectContact} onNavigate={onNavigate} />
          )}
          {hasVendors && vendors && vendorContracts && (
            <VendorSummary vendors={vendors} vendorContracts={vendorContracts} />
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {hasCrm && (
            <RecentActivity touchpoints={touchpoints} contacts={contacts} onSelectContact={onSelectContact} />
          )}
          {hasCustomerContracts && customerContracts && (
            <ContractSummary customerContracts={customerContracts} contacts={contacts} />
          )}
        </div>
      </div>
    </div>
  );
}
