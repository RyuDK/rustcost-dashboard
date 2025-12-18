import {
  IoSpeedometerOutline,
  IoTrendingUpOutline,
  IoConstructOutline,
  IoSettingsOutline,
  IoLayersOutline,
  IoGitBranchOutline,
  IoCubeOutline,
  IoFileTrayFullOutline,
  IoAlertCircleOutline,
  IoHardwareChipOutline,
  IoPricetagOutline,
} from "react-icons/io5";
import type { NavItem } from "@/types/nav";

export const navItems: NavItem[] = [
  { to: "/", translationKey: "nav.dashboard", icon: IoSpeedometerOutline },
  {
    to: "/workloads",
    translationKey: "nav.workloads",
    icon: IoLayersOutline,
    children: [
      {
        to: "/workloads/metrics",
        translationKey: "nav.metrics",
        icon: IoFileTrayFullOutline,
        children: [
          {
            to: "/workloads/metrics/nodes",
            translationKey: "nav.nodes",
            icon: IoHardwareChipOutline,
          },
          {
            to: "/workloads/metrics/pods",
            translationKey: "nav.pods",
            icon: IoCubeOutline,
          },
          {
            to: "/workloads/metrics/containers",
            translationKey: "nav.containers",
            icon: IoConstructOutline,
          },
        ],
      },
      {
        to: "/workloads/resources",
        translationKey: "nav.resources",
        icon: IoCubeOutline,
        children: [
          {
            to: "/workloads/resources/deployments",
            translationKey: "nav.deployments",
            icon: IoGitBranchOutline,
          },
          {
            to: "/workloads/resources/nodes",
            translationKey: "nav.nodes",
            icon: IoHardwareChipOutline,
          },
          {
            to: "/workloads/resources/containers",
            translationKey: "nav.containers",
            icon: IoConstructOutline,
          },
          {
            to: "/workloads/resources/pods",
            translationKey: "nav.pods",
            icon: IoCubeOutline,
          },
          {
            to: "/workloads/resources/statefulsets",
            translationKey: "nav.statefulSets",
            icon: IoLayersOutline,
          },
          {
            to: "/workloads/resources/daemonsets",
            translationKey: "nav.daemonSets",
            icon: IoHardwareChipOutline,
          },
          {
            to: "/workloads/resources/jobs",
            translationKey: "nav.jobsCronJobs",
            icon: IoFileTrayFullOutline,
          },
          {
            to: "/workloads/resources/services",
            translationKey: "nav.services",
            icon: IoAlertCircleOutline,
          },
          {
            to: "/workloads/resources/ingresses",
            translationKey: "nav.ingresses",
            icon: IoPricetagOutline,
          },
          {
            to: "/workloads/resources/namespaces",
            translationKey: "nav.namespaces",
            icon: IoCubeOutline,
          },
          {
            to: "/workloads/resources/persistent-volumes",
            translationKey: "nav.persistentVolumes",
            icon: IoFileTrayFullOutline,
          },
          {
            to: "/workloads/resources/persistent-volume-claims",
            translationKey: "nav.persistentVolumeClaims",
            icon: IoLayersOutline,
          },
        ],
      },
    ],
  },
  { to: "/trends", translationKey: "nav.trends", icon: IoTrendingUpOutline },
  {
    to: "/efficiency",
    translationKey: "nav.efficiency",
    icon: IoConstructOutline,
  },
  {
    to: "/allocation",
    translationKey: "nav.allocation",
    icon: IoGitBranchOutline,
  },
  { to: "/alerts", translationKey: "nav.alerts", icon: IoAlertCircleOutline },
  { to: "/system", translationKey: "nav.system", icon: IoHardwareChipOutline },
  { to: "/settings", translationKey: "nav.settings", icon: IoSettingsOutline },
  {
    to: "/unit-prices",
    translationKey: "nav.unitPrices",
    icon: IoPricetagOutline,
  },
  {
    to: "/ai-report",
    translationKey: "nav.aiReport",
    icon: IoPricetagOutline,
  },
  {
    to: "/ai-insight",
    translationKey: "nav.aiInsight",
    icon: IoPricetagOutline,
  },
];
