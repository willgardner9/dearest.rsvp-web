import { Anchor, type AnchorProps } from "@mantine/core";
import { createLink } from "@tanstack/react-router";
import { forwardRef, type AnchorHTMLAttributes } from "react";

const MantineAnchor = forwardRef<
  HTMLAnchorElement,
  AnchorProps & AnchorHTMLAttributes<HTMLAnchorElement>
>((props, ref) => <Anchor ref={ref} {...props} />);

// A Mantine Anchor with typed router links.
export const AnchorLink = createLink(MantineAnchor);
