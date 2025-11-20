import request from "@/utils/request";
import type {
  SettingGroupType,
  SettingGroup,
  SettingGroupResponse,
  UpdateSettingGroupRequest,
} from "@/types/sysconfig";

// 获取配置分组列表
export const getSettingGroups = (): Promise<SettingGroup[]> => {
  return request.get("/admin/settings/groups");
};

// 获取指定分组的配置
export const getSettingGroup = (
  group: SettingGroupType
): Promise<SettingGroupResponse> => {
  return request.get(`/admin/settings/${group}`);
};

// 更新指定分组的配置（自动热重载）
export const updateSettingGroup = (
  group: SettingGroupType,
  data: UpdateSettingGroupRequest
) => {
  return request.patch(`/admin/settings/${group}`, data);
};
