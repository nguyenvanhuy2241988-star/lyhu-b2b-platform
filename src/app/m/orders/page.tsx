"use client";

import { ModuleGate } from '@/components/ModuleGate';
import { MODULES } from '@/modules/registry';

export default function OrdersModulePage() {
    return <ModuleGate moduleDef={MODULES.orders} />;
}
