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
import { updateInventoryRecord, backendIntegrityCheck } from '@/services/ant-design-pro/api';
import { getUserErrors, getLabelMessage } from './utils';

interface UpdateFormProps {
  reload?: ActionType['reload'],
  inventoryItem?: API.InventoryListItem
}

const UpdateForm: FC<UpdateFormProps> = (props) => {
  const { reload, inventoryItem } = props;
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

  const {run, loading} = useRequest(updateInventoryRecord, {
    manual: true,
    onSuccess: () => {
      messageApi.success('更新できました。');
      setTimeout(() => {
        reload?.();
      },1000)
    },
    onError: () => {
      messageApi.error('更新できません。');
    },
  });

  const submitForm = async (formData: API.InventoryListItem) => {
    const params = {
      pkCheck: false,
      datatypeCheck: true,
      timeLogicCheck: false,
    }

    try {
      const response = await backendIntegrityCheck(params, formData);
      // console.log(response);

    } catch (error: any) {
      messageApi.error('更新できません。');
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
        title="更新"
        trigger={<Button icon={<EditOutlined />}> </Button>}
        width="80%"
        initialValues={inventoryItem}
        modalProps={{ okButtonProps: { loading }, okText:"更新" }}
        onFinish={async (value) => {
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
            <ProFormText rules={[
              { required: true, message: "必要" },
            ]} width="md" label="会社コード" name="companyCode"
              fieldProps={{
                disabled: true,
                maxLength: 4,
                showCount: true,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 4);
                  formRef.current?.setFieldsValue({
                    companyCode: trimmed
                  });
                }
              }}
            />
          </Col>
          <Col span={8}>
            <ProFormText rules={[
              { required: true, message: "必要" },
            ]} width="md" label="従来工場コード" name="previousFactoryCode"
              fieldProps={{
                disabled: true,
                maxLength: 4,
                showCount: true,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 4);
                  formRef.current?.setFieldsValue({
                    previousFactoryCode: trimmed
                  });
                }
              }}
            />
          </Col>
          <Col span={8}>
            <ProFormText rules={[
              { required: true, message: "必要" },
            ]} width="md" label="商品工場コード" name="productFactoryCode"
              fieldProps={{
                disabled: true,
                maxLength: 4,
                showCount: true,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 4);
                  formRef.current?.setFieldsValue({
                    productFactoryCode: trimmed
                  });
                }
              }}
            />
          </Col>
        </Row>
        <Row>
          <Col span={8}>
            <ProFormDatePicker  rules={[{ required: true, message: "必要" }]} width="md" label="運用開始日" name="startOperationDate"
              fieldProps={{
                disabled: true,
              }}
            />
          </Col>
          <Col span={8}>
            <ProFormDatePicker  rules={[{ required: true, message: "必要" }]} width="md" label="運用終了日" name="endOperationDate"
              fieldProps={{
                disabled: true,
              }}
            />
          </Col>
          <Col span={8}>
            <ProFormText width="md" label="従来工場名" name="previousFactoryName" fieldProps={{
                maxLength: 100,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 100);
                  formRef.current?.setFieldsValue({
                    previousFactoryName: trimmed
                  });
                }
              }} />
          </Col>
        </Row>
        <Row>
          <Col span={8}>
            <ProFormText width="md" label="商品工場名" name="productFactoryName" fieldProps={{
                maxLength: 100,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 100);
                  formRef.current?.setFieldsValue({
                    productFactoryName: trimmed
                  });
                }
              }} />
          </Col>
          <Col span={8}>
            <ProFormText
              rules={[]}
              width="md"
              label="マテリアル部署コード"
              name="materialDepartmentCode"
              fieldProps={{
                maxLength: 4,
                showCount: true,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 4);
                  formRef.current?.setFieldsValue({
                    materialDepartmentCode: trimmed
                  });
                }
              }} />
          </Col>
          <Col span={8}>
            <ProFormText width="md" label="環境情報" name="environmentalInformation" fieldProps={{
                maxLength: 100,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 100);
                  formRef.current?.setFieldsValue({
                    environmentalInformation: trimmed
                  });
                }
              }} />
          </Col>
        </Row>
        <Row>
          <Col span={8}>
            <ProFormText width="md" label="認証フラグ" name="authenticationFlag" fieldProps={{
                maxLength: 100,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 100);
                  formRef.current?.setFieldsValue({
                    authenticationFlag: trimmed
                  });
                }
              }} />
          </Col>
          <Col span={8}>
            <ProFormText
              rules={[]}
              width="md"
              label="企業コード"
              name="groupCorporateCode"
              fieldProps={{
                maxLength: 4,
                showCount: true,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 4);
                  formRef.current?.setFieldsValue({
                    groupCorporateCode: trimmed
                  });
                }
              }} />
          </Col>
          <Col span={8}>
            <ProFormText width="md" label="連携パターン" name="integrationPattern"fieldProps={{
                maxLength: 100,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 100);
                  formRef.current?.setFieldsValue({
                    integrationPattern: trimmed
                  });
                }
              }}  />
          </Col>
        </Row>
        <Row>
          <Col span={8}>
            <ProFormText width="md" label="HULFTID" name="hulftid"fieldProps={{
                maxLength: 100,
                onChange: (e) => {
                  const trimmed = e.target.value.slice(0, 100);
                  formRef.current?.setFieldsValue({
                    hulftid: trimmed
                  });
                }
              }}  />
          </Col>
        </Row>
      </ModalForm>
    </>
  );
};

export default UpdateForm;
