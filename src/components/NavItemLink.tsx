import { NavLink, type NavLinkProps } from "@mantine/core";
import { createLink } from "@tanstack/react-router";
import { forwardRef, type AnchorHTMLAttributes } from "react";

const MantineNavLink = forwardRef<
  HTMLAnchorElement,
  NavLinkProps & AnchorHTMLAttributes<HTMLAnchorElement>
>((props, ref) => <NavLink ref={ref} {...props} />);

// A Mantine NavLink with typed router links. The active state follows the route.
export const NavItemLink = createLink(MantineNavLink);
