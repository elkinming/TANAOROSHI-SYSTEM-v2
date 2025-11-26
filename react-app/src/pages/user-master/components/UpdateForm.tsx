import { EditOutlined } from '@ant-design/icons';
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
import { updateUserRecord } from '@/services/ant-design-pro/api';

interface UpdateFormProps {
  reload?: ActionType['reload'],
  userItem?: API.UserListItem
}

const UpdateForm: FC<UpdateFormProps> = (props) => {
  const { reload, userItem } = props;
  // console.log(userItem);
  const [messageApi, contextHolder] = message.useMessage();
  /**
   * @en-US International configuration
   * @zh-CN 国际化配置
   * */
  const intl = useIntl();

  const {run, loading} = useRequest(updateUserRecord, {
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

  return (
    <>
      {contextHolder}
      <ModalForm
        title="更新"
        trigger={<Button icon={<EditOutlined />}> </Button>}
        width="80%"
        initialValues={userItem}
        modalProps={{ okButtonProps: { loading }, okText:"更新" }}
        onFinish={async (value) => {
          value.id = userItem?.id;
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
            <ProFormDigit rules={[{ required: true, message: "必要" }]} width="md" label="年齢" name="age" min={0}  />
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

export default UpdateForm;

