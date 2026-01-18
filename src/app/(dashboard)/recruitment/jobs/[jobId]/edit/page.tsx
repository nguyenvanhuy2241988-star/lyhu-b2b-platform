"use client";

import JobEditor from "@/components/recruitment/JobEditor";
import { useParams } from "next/navigation";

export default function EditJobPage() {
    const { jobId } = useParams();
    return <JobEditor jobId={jobId as string} />;
}
