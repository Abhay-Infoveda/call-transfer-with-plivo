import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/users');
  // Return null as redirect will prevent rendering, but a return is needed.
  return null;
}
