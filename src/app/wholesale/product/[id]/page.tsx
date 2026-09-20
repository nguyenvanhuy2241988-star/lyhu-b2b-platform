import { redirect } from 'next/navigation';

export default function ProductRedirectPage({ params }: { params: { id: string } }) {
    redirect(`/?p=${params.id}`);
}
