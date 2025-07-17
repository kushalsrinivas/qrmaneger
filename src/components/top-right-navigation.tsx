"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Settings,
  BarChart3,
  CreditCard,
  LogOut,
  QrCode,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface TopRightNavigationProps {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  isLoading?: boolean;
}

export function TopRightNavigation({
  user,
  isLoading,
}: TopRightNavigationProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn("google", { redirectTo: "/" });
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ redirectTo: "/" });
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const getUserInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getInitialsColor = (name?: string | null) => {
    if (!name) return "bg-gray-500";
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-10 w-10 items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  // Unauthenticated state
  if (!user) {
    return (
      <div className="flex items-center">
        <Button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="bg-[#4285F4] font-medium text-white shadow-md transition-all duration-200 hover:bg-[#3367D6] hover:shadow-lg"
        >
          {isSigningIn ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Signing in...</span>
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="hidden sm:inline">Sign In with Google</span>
              <span className="sm:hidden">Sign In</span>
            </>
          )}
        </Button>
      </div>
    );
  }

  // Authenticated state
  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full ring-2 ring-transparent transition-all duration-200 hover:ring-gray-200"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.image || ""} alt={user.name || "User"} />
              <AvatarFallback
                className={`${getInitialsColor(user.name)} font-medium text-white`}
              >
                {getUserInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 p-0" align="end" forceMount>
          {/* User Info Section */}
          <div className="border-b px-4 py-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                <AvatarFallback
                  className={`${getInitialsColor(user.name)} font-medium text-white`}
                >
                  {getUserInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {user.name || "User"}
                </p>
                <p className="truncate text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation Options */}
          <div className="py-1">
            <DropdownMenuItem asChild>
              <Link
                href="/codes"
                className="flex items-center px-4 py-2 text-sm"
              >
                <QrCode className="mr-3 h-4 w-4" />
                My QR Codes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/settings"
                className="flex items-center px-4 py-2 text-sm"
              >
                <Settings className="mr-3 h-4 w-4" />
                Account Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/analytics"
                className="flex items-center px-4 py-2 text-sm"
              >
                <BarChart3 className="mr-3 h-4 w-4" />
                Analytics Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/billing"
                className="flex items-center px-4 py-2 text-sm"
              >
                <CreditCard className="mr-3 h-4 w-4" />
                Billing
              </Link>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator />

          {/* Sign Out */}
          <div className="py-1">
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {isSigningOut ? (
                <Loader2 className="mr-3 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-3 h-4 w-4" />
              )}
              Sign Out
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
