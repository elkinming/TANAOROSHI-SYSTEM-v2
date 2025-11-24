// @ts-ignore
/* eslint-disable */
import { v4 as uuidv4 } from 'uuid';

// Adapter function to transform InventoryListItem to BackendInventoryListItem (camelCase to snake_case)
export function adaptInventoryItemToBackend(item: API.InventoryListItem): API.BackendInventoryListItem {
  return {
    id: item.id,
    company_code: item.companyCode,
    previous_factory_code: item.previousFactoryCode,
    product_factory_code: item.productFactoryCode,
    start_operation_date: item.startOperationDate,
    end_operation_date: item.endOperationDate,
    previous_factory_name: item.previousFactoryName,
    product_factory_name: item.productFactoryName,
    material_department_code: item.materialDepartmentCode,
    environmental_information: item.environmentalInformation,
    authentication_flag: item.authenticationFlag,
    group_corporate_code: item.groupCorporateCode,
    integration_pattern: item.integrationPattern,
    hulftid: item.hulftid,
  };
}

// Adapter function to transform BackendInventoryListItem to InventoryListItem (snake_case to camelCase)
export function adaptBackendInventoryItemToFrontend(item: API.BackendInventoryListItem): API.InventoryListItem {
  return {
    id: item.id,
    companyCode: item.company_code,
    previousFactoryCode: item.previous_factory_code,
    productFactoryCode: item.product_factory_code,
    startOperationDate: item.start_operation_date,
    endOperationDate: item.end_operation_date,
    previousFactoryName: item.previous_factory_name,
    productFactoryName: item.product_factory_name,
    materialDepartmentCode: item.material_department_code,
    environmentalInformation: item.environmental_information,
    authenticationFlag: item.authentication_flag,
    groupCorporateCode: item.group_corporate_code,
    integrationPattern: item.integration_pattern,
    hulftid: item.hulftid,
  };
}

// Adapter function to transform backend response to InventoryList format
export function adaptInventoryResponse(backendResponse: API.BackendInventoryResponse): API.InventoryList {
  const adaptedItems: API.InventoryListItem[] = (backendResponse.data?.items || []).map((item) => ({
    id: uuidv4(),
    companyCode: item.company_code,
    previousFactoryCode: item.previous_factory_code,
    productFactoryCode: item.product_factory_code,
    startOperationDate: item.start_operation_date,
    endOperationDate: item.end_operation_date,
    previousFactoryName: item.previous_factory_name,
    productFactoryName: item.product_factory_name,
    materialDepartmentCode: item.material_department_code,
    environmentalInformation: item.environmental_information,
    authenticationFlag: item.authentication_flag,
    groupCorporateCode: item.group_corporate_code,
    integrationPattern: item.integration_pattern,
    hulftid: item.hulftid,
  }));

  return {
    data: adaptedItems,
    total: backendResponse.data?.total ?? undefined,
    success: backendResponse.code === 200,
  };
}

