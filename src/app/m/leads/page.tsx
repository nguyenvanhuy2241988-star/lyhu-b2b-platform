"use client";

import { ModuleGate } from '@/components/ModuleGate';
import { MODULES } from '@/modules/registry';

export default function LeadsModulePage() {
    return <ModuleGate moduleDef={MODULES.leads} />;
}
