'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LayoutDashboard, Calendar, CheckSquare, Users, FileText, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard/today" className="flex items-center space-x-2 font-bold">
              <LayoutDashboard className="h-5 w-5" />
              <span>LearnLynk</span>
            </Link>
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/dashboard/today">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Today
                </Button>
              </Link>
              <Link href="/dashboard/tasks">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  All Tasks
                </Button>
              </Link>
              <Link href="/dashboard/tasks/create">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Create Task
                </Button>
              </Link>
              <Link href="/dashboard/leads">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Leads
                </Button>
              </Link>
              <Link href="/dashboard/applications">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Applications
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full flex items-center justify-center bg-black text-white">
                  {/* <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground">
                  </div> */}
                    {user.email?.charAt(0).toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Account</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}

