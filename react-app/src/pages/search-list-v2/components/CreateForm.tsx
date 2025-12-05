import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  type ActionType,
  ModalForm,
  ProFormDatePicker,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useRequest } from '@umijs/max';
import { Button, Col, FormInstance, message, Row } from 'antd';
import React, { useRef, useState, type FC } from 'react';
import { addInventoryRecord, backendIntegrityCheck } from '@/services/ant-design-pro/api';
import { getUserErrors, getLabelMessage } from './utils';

interface CreateFormProps {
  reload?: ActionType['reload'],
}

const CreateForm: FC<CreateFormProps> = (props) => {
  const { reload } = props;
  const formRef = useRef<FormInstance>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [errorCodes, setErrorCodes] = useState<any[]>([]);
  const [errorMessages, setErrorMessages] = useState<any[]>([]);
  const [errorData, setErrorData] = useState<any[]>([]);
  const [pkDetail, setPkDetail] = useState<string>('');
  /**
   * @en-US International configuration
   * @zh-CN 国际化配置
   * */
  const intl = useIntl();
  const getLocaleMessage = (id: string) => intl.formatMessage({ id });

  const {run, loading} = useRequest(addInventoryRecord, {
    manual: true,
    onSuccess: () => {
      messageApi.success(getLocaleMessage('pages.searchList.create.success'));
      setTimeout(() => {
        reload?.();
      },1000)
    },
    onError: () => {
      messageApi.error(getLocaleMessage('pages.searchList.create.error'));
    },
  });

  const submitForm = async (formData: API.InventoryListItem) => {
    const params = {
      pkCheck: true,
      datatypeCheck: true,
      timeLogicCheck: true,
    }

    try {
      const response = await backendIntegrityCheck(params, formData);
      console.log(response);

    } catch (error: any) {
      messageApi.error(getLocaleMessage('pages.searchList.create.error'));
      console.log(error);
      const userErrorCodes = getUserErrors(error?.response?.data?.data?.error_codes);
      setErrorCodes(userErrorCodes);
      setErrorMessages(error?.response?.data?.data?.error_messages);
      setErrorData(error?.response?.data?.data?.error_data);
      setPkDetail(error?.response?.data?.data?.pk_detail);
      return false;
    }

    await run(formData);
    return true;
  }

  return (
    <>
      {contextHolder}
      <ModalForm
        formRef={formRef}
        onOpenChange={(open)=>{
          if(!open){
            formRef.current?.resetFields();
            setErrorCodes([]);
            setErrorMessages([]);
            setErrorData([]);
            setPkDetail('');
          }

        }}
        title={getLocaleMessage('pages.searchList.addRecordButton')}
        trigger={
          <Button type="primary">
            <FormattedMessage id="pages.searchTable.new" defaultMessage="New" />
          </Button>
        }
        width="80%"
        modalProps={{ okButtonProps: { loading }, okText: getLocaleMessage('pages.searchList.form.submit') }}
        onFinish={async (value) => {
          // await run(value as API.InventoryListItem);
          const result = await submitForm(value as API.InventoryListItem);
          return result;
        }}

      >
      {errorCodes.length > 0 && (
          <div style={{
            flex: '0 0 auto',
            maxHeight: '105px',
            overflowY: 'auto',
            marginBottom: '12px',
            border: '1px solid #ffccc7',
            borderRadius: '4px',
            backgroundColor: '#fff2f0',
            padding: '8px 12px'
          }}>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {errorCodes.map((item, index) => {
                  const message = item
                  return (
                    <li
                      key={index}
                      style={{
                        marginBottom: '4px',
                        color: '#ff4d4f',
                        listStyleType: 'disc'
                      }}
                    >
                      <FormattedMessage id={message} values={{
                        value: pkDetail,
                        field_name: getLabelMessage(errorData[index]?.field_name),
                        expected_type_str: errorData[index]?.expected_type_str,
                        actual_type_str: errorData[index]?.actual_type_str,
                        max_length: errorData[index]?.max_length,
                        actual_length: errorData[index]?.actual_length,
                        pk_conflicted: errorData[index]?.pk_conflicted}}
                      />

                    </li>
                  );
                })}
            </ul>
          </div>
        )}
        <Row>
          <Col span={8}>
            <ProFormText
              rules={[
                { required: true, message: getLocaleMessage('pages.searchList.validation.required') },
              ]}
              fieldProps={{
                maxLength: 4,
                showCount: true,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 4);
                  formRef.current?.setFieldsValue({
                    companyCode: trimmed
                  });
                }
              }}
              width="md"
              label={getLocaleMessage('pages.searchList.columnCompanyCode')}
              name="companyCode"
            />
          </Col>
          <Col span={8}>
            <ProFormText
              rules={[
                { required: true, message: getLocaleMessage('pages.searchList.validation.required') },
              ]}
              fieldProps={{
                maxLength: 4,
                showCount: true,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 4);
                  formRef.current?.setFieldsValue({
                    previousFactoryCode: trimmed
                  });
                }
              }}
              width="md"
              label={getLocaleMessage('pages.searchList.columnPreviousFactoryCode')}
              name="previousFactoryCode"
            />
          </Col>
          <Col span={8}>
            <ProFormText
              rules={[
                { required: true, message: getLocaleMessage('pages.searchList.validation.required') },
              ]}
              fieldProps={{
                maxLength: 4,
                showCount: true,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 4);
                  formRef.current?.setFieldsValue({
                    productFactoryCode: trimmed
                  });
                }
              }}
              width="md"
              label={getLocaleMessage('pages.searchList.columnProductFactoryCode')}
              name="productFactoryCode"
            />
          </Col>
        </Row>
        <Row>
          <Col span={8}>
            <ProFormDatePicker
              rules={[{ required: true, message: getLocaleMessage('pages.searchList.validation.required') }]}
              width="md"
              label={getLocaleMessage('pages.searchList.columnStartOperationDate')}
              name="startOperationDate"
            />
          </Col>
          <Col span={8}>
            <ProFormDatePicker
              rules={[{ required: true, message: getLocaleMessage('pages.searchList.validation.required') }]}
              width="md"
              label={getLocaleMessage('pages.searchList.columnEndOperationDate')}
              name="endOperationDate"
            />
          </Col>
          <Col span={8}>
            <ProFormText
              width="md"
              label={getLocaleMessage('pages.searchList.columnPreviousFactoryName')}
              name="previousFactoryName"
              fieldProps={{
                maxLength: 100,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 100);
                  formRef.current?.setFieldsValue({
                    previousFactoryName: trimmed
                  });
                }
              }}
            />
          </Col>
        </Row>
        <Row>
          <Col span={8}>
            <ProFormText
              width="md"
              label={getLocaleMessage('pages.searchList.columnProductFactoryName')}
              name="productFactoryName"
              fieldProps={{
                maxLength: 100,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 100);
                  formRef.current?.setFieldsValue({
                    productFactoryName: trimmed
                  });
                }
              }}
            />
          </Col>
          <Col span={8}>
            <ProFormText
              rules={[]}
              fieldProps={{
                maxLength: 4,
                showCount: true,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 4);
                  formRef.current?.setFieldsValue({
                    materialDepartmentCode: trimmed
                  });
                }
              }}
              width="md"
              label={getLocaleMessage('pages.searchList.columnMaterialDepartmentCode')}
              name="materialDepartmentCode"
            />
          </Col>
          <Col span={8}>
            <ProFormText
              width="md"
              label={getLocaleMessage('pages.searchList.columnEnvironmentalInformation')}
              name="environmentalInformation"
              fieldProps={{
                maxLength: 100,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 100);
                  formRef.current?.setFieldsValue({
                    environmentalInformation: trimmed
                  });
                }
              }}
            />
          </Col>
        </Row>
        <Row>
          <Col span={8}>
            <ProFormText
              width="md"
              label={getLocaleMessage('pages.searchList.columnAuthenticationFlag')}
              name="authenticationFlag"
              fieldProps={{
                maxLength: 100,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 100);
                  formRef.current?.setFieldsValue({
                    authenticationFlag: trimmed
                  });
                }
              }}
            />
          </Col>
          <Col span={8}>
            <ProFormText
              rules={[]}
              fieldProps={{
                maxLength: 4,
                showCount: true,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 4);
                  formRef.current?.setFieldsValue({
                    groupCorporateCode: trimmed
                  });
                }
              }}
              width="md"
              label={getLocaleMessage('pages.searchList.columnGroupCorporateCode')}
              name="groupCorporateCode"
            />
          </Col>
          <Col span={8}>
            <ProFormText
              width="md"
              label={getLocaleMessage('pages.searchList.columnIntegrationPattern')}
              name="integrationPattern"
              fieldProps={{
                maxLength: 100,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 100);
                  formRef.current?.setFieldsValue({
                    integrationPattern: trimmed
                  });
                }
              }}
            />
          </Col>
        </Row>
        <Row>
          <Col span={8}>
            <ProFormText
              width="md"
              label={getLocaleMessage('pages.searchList.columnHulftid')}
              name="hulftid"
              fieldProps={{
                maxLength: 100,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 100);
                  formRef.current?.setFieldsValue({
                    hulftid: trimmed
                  });
                }
              }}
            />
          </Col>
        </Row>
      </ModalForm>
    </>
  );
};

export default CreateForm;
