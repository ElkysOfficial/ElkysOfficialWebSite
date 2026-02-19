/**
 * ELKYS Icon System
 * SVG icons imported as React components via SVGR.
 * Original SVGs sourced from Lucide (ISC License — see LICENSE in this directory).
 */

import { createIcon } from "./create-icon";

// --- SVG imports (tree-shakeable via ?react suffix) ---
import ArrowLeftSvg from "./svg/arrow-left.svg?react";
import ArrowRightSvg from "./svg/arrow-right.svg?react";
import ArrowUpSvg from "./svg/arrow-up.svg?react";
import Building2Svg from "./svg/building-2.svg?react";
import CheckCircleSvg from "./svg/check-circle.svg?react";
import ChevronRightSvg from "./svg/chevron-right.svg?react";
import ClockSvg from "./svg/clock.svg?react";
import Code2Svg from "./svg/code-2.svg?react";
import CodeSvg from "./svg/code.svg?react";
import CogSvg from "./svg/cog.svg?react";
import CookieSvg from "./svg/cookie.svg?react";
import ExternalLinkSvg from "./svg/external-link.svg?react";
import EyeSvg from "./svg/eye.svg?react";
import FileTextSvg from "./svg/file-text.svg?react";
import GithubSvg from "./svg/github.svg?react";
import GlobeSvg from "./svg/globe.svg?react";
import HeartSvg from "./svg/heart.svg?react";
import HomeSvg from "./svg/home.svg?react";
import InstagramSvg from "./svg/instagram.svg?react";
import LinkedinSvg from "./svg/linkedin.svg?react";
import MailSvg from "./svg/mail.svg?react";
import MenuSvg from "./svg/menu.svg?react";
import NetworkSvg from "./svg/network.svg?react";
import PhoneSvg from "./svg/phone.svg?react";
import PlaySvg from "./svg/play.svg?react";
import QuoteSvg from "./svg/quote.svg?react";
import SearchSvg from "./svg/search.svg?react";
import SendSvg from "./svg/send.svg?react";
import ShieldSvg from "./svg/shield.svg?react";
import StarSvg from "./svg/star.svg?react";
import TargetSvg from "./svg/target.svg?react";
import TrendingUpSvg from "./svg/trending-up.svg?react";
import WrenchSvg from "./svg/wrench.svg?react";
import XSvg from "./svg/x.svg?react";
import ZapSvg from "./svg/zap.svg?react";

// --- Named exports (match lucide-react naming) ---
export const ArrowLeft = createIcon(ArrowLeftSvg, "ArrowLeft");
export const ArrowRight = createIcon(ArrowRightSvg, "ArrowRight");
export const ArrowUp = createIcon(ArrowUpSvg, "ArrowUp");
export const Building2 = createIcon(Building2Svg, "Building2");
export const CheckCircle = createIcon(CheckCircleSvg, "CheckCircle");
export const ChevronRight = createIcon(ChevronRightSvg, "ChevronRight");
export const Clock = createIcon(ClockSvg, "Clock");
export const Code2 = createIcon(Code2Svg, "Code2");
export const Code = createIcon(CodeSvg, "Code");
export const Cog = createIcon(CogSvg, "Cog");
export const Cookie = createIcon(CookieSvg, "Cookie");
export const ExternalLink = createIcon(ExternalLinkSvg, "ExternalLink");
export const Eye = createIcon(EyeSvg, "Eye");
export const FileText = createIcon(FileTextSvg, "FileText");
export const Github = createIcon(GithubSvg, "Github");
export const Globe = createIcon(GlobeSvg, "Globe");
export const Heart = createIcon(HeartSvg, "Heart");
export const Home = createIcon(HomeSvg, "Home");
export const Instagram = createIcon(InstagramSvg, "Instagram");
export const Linkedin = createIcon(LinkedinSvg, "Linkedin");
export const Mail = createIcon(MailSvg, "Mail");
export const Menu = createIcon(MenuSvg, "Menu");
export const Network = createIcon(NetworkSvg, "Network");
export const Phone = createIcon(PhoneSvg, "Phone");
export const Play = createIcon(PlaySvg, "Play");
export const Quote = createIcon(QuoteSvg, "Quote");
export const Search = createIcon(SearchSvg, "Search");
export const Send = createIcon(SendSvg, "Send");
export const Shield = createIcon(ShieldSvg, "Shield");
export const Star = createIcon(StarSvg, "Star");
export const Target = createIcon(TargetSvg, "Target");
export const TrendingUp = createIcon(TrendingUpSvg, "TrendingUp");
export const Wrench = createIcon(WrenchSvg, "Wrench");
export const X = createIcon(XSvg, "X");
export const Zap = createIcon(ZapSvg, "Zap");

// Re-export types
export type { IconProps } from "./create-icon";
