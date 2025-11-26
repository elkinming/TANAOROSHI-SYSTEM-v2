import {
  type ActionType,
  ModalForm,
  ProFormDigit,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useRequest } from '@umijs/max';
import { Button, Col, message, Row } from 'antd';
import React, { type FC } from 'react';
import { addUserRecord } from '@/services/ant-design-pro/api';

interface CreateFormProps {
  reload?: ActionType['reload'],
}

const CreateForm: FC<CreateFormProps> = (props) => {
  const { reload } = props;

  const [messageApi, contextHolder] = message.useMessage();
  /**
   * @en-US International configuration
   * @zh-CN 国际化配置
   * */
  const intl = useIntl();

  const {run, loading} = useRequest(addUserRecord, {
    manual: true,
    onSuccess: () => {
      messageApi.success('新規登録されました。');
      setTimeout(() => {
        reload?.();
      },1000)
    },
    onError: () => {
      messageApi.error('新規登録できません。');
    },
  });

  return (
    <>
      {contextHolder}
      <ModalForm
        title="新規登録"
        trigger={
          <Button type="primary">
            <FormattedMessage id="pages.searchTable.new" defaultMessage="New" />
          </Button>
        }
        width="80%"
        modalProps={{ okButtonProps: { loading }, okText: "登録" }}
        onFinish={async (value) => {
          await run(value as API.UserListItem);
          return true;
        }}
      >

        <Row>
          <Col span={8}>
            <ProFormText rules={[{ required: true, message: "必要" }]} width="md" label="名前" name="name" />
          </Col>
          <Col span={8}>
            <ProFormText rules={[{ required: true, message: "必要" }]} width="md" label="氏名" name="lastname" />
          </Col>
          <Col span={8}>
            <ProFormDigit rules={[{ required: true, message: "必要" }]} width="md" label="年齢" name="age" min={0} />
          </Col>
        </Row>
        <Row>
          <Col span={8}>
            <ProFormText width="md" label="国籍" name="country" />
          </Col>
          <Col span={16}>
            <ProFormTextArea width="md" label="住所" name="homeAddress" />
          </Col>
        </Row>
      </ModalForm>
    </>
  );
};

export default CreateForm;

