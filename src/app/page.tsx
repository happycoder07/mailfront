import { redirect } from 'next/navigation';
import Image from 'next/image';

export default function HomePage() {
  redirect('/auth/login');
}
