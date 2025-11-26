import { SearchOutlined } from '@ant-design/icons';
import type {
  ActionType,
  ProColumns,
} from '@ant-design/pro-components';
import {
  EditableProTable,
  PageContainer,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Input, InputRef, message, Space, TableColumnType, Upload } from 'antd';
import { FilterDropdownProps } from 'antd/es/table/interface';
import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import PageContent from '@/components/PageContent';
import PageTitle from '@/components/PageTitle';
import { deleteUserRecordArray, getAllUsers, insertUserRecordArray, updateUserRecordBatch } from '@/services/ant-design-pro/api';
import { adaptBackendUserItemToFrontend } from '@/services/ant-design-pro/userAdapters';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';

interface DataType {
  name: string;
  lastname: string;
  age: number;
  country: string;
  homeAddress: string;
}

type DataIndex = keyof DataType;

const UserMaster: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType | null>(null);
  const formRef = useRef<any>(null);

  const [current, setCurrent] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [dataSource, setDataSource] = useState<API.UserListItem[]>([]);
  const [editDataSource, setEditDataSource] = useState<API.UserListItem[]>([]);
  const searchInput = useRef<InputRef>(null);
  const [editableKeys, setEditableRowKeys] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<any[]>([]);
  const [hideRowEditButton, setHideRowEditButton] = useState(false);
  const [showRowSelection, setShowRowSelection] = useState(false);
  const [allowEditPkFields, setAllowEditPkFields] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();
  const [errorResults, setErrorResults] = useState<any[]>([]);

  const initData = () => {
    setCurrent(1);
    setDataSource([]);
    setErrorResults([]);
    setEditDataSource([]);
    setEditableRowKeys([]);
    setSelectedRowKeys([]);
    setIsEditing(false);
    setIsInserting(false);
    setIsDeleting(false);
    setHideRowEditButton(false);
    setShowRowSelection(false);
  };

  const getDataSource = async(params? : any) => {
    initData();
    const response = await getAllUsers(params);
    setDataSource(response.data!);
    setTotal(response.data?.length ? response.data?.length : 0)
    return response
  }

  const refreshDataSource = async(params? : any) => {
    const response = await getAllUsers(params);
    setDataSource(response.data!);
    setTotal(response.data?.length ? response.data?.length : 0)
    return response
  }

  const matchRecord = (record1: API.UserListItem, record2: API.UserListItem): boolean => {
    return (
      record1.name === record2.name &&
      record1.lastname === record2.lastname &&
      record1.age === record2.age
    );
  };

  const addIdsToErrorRecords = (errorItems: API.CommitUserRecordError[]): API.CommitUserRecordError[] => {
    return errorItems.map((errorItem) => {
      const matchedRecord = dataSource.find((dsRecord) =>
        matchRecord(errorItem.record, dsRecord)
      );

      if (matchedRecord && matchedRecord.id) {
        return {
          ...errorItem,
          record: {
            ...errorItem.record,
            id: matchedRecord.id,
          },
        };
      }

      return errorItem;
    });
  };

  const updateDataSource = async () => {
    try {
      const response = await updateUserRecordBatch(editDataSource);
      messageApi.success(<FormattedMessage id="msg.success.updateSuccess" />);
      await getDataSource();

    } catch (e: any) {
      const rawErrorItems = e.response.data.error.details.error_records as API.CommitUserRecordError[];
      // Convert BackendUserListItem records to UserListItem
      const convertedErrorItems: API.CommitUserRecordError[] = rawErrorItems.map((errorItem) => ({
        ...errorItem,
        record: adaptBackendUserItemToFrontend(errorItem.record as API.BackendUserListItem),
      }));
      const errorItems = convertedErrorItems.filter(item => item.level === 'E' || item.level === 'W');
      const errorItemsWithIds = addIdsToErrorRecords(errorItems);
      setErrorResults(getUserErrors(errorItemsWithIds));
      messageApi.error(<FormattedMessage id="msg.error.updateFailed" />);
    }
  }

  const saveNewRecordsOnDataSource = async () => {
    try {
      const response = await insertUserRecordArray(editDataSource);
      messageApi.success(<FormattedMessage id="msg.success.insertSuccess" />);
      await getDataSource();

    } catch (e: any) {
      const rawErrorItems = e.response.data.error.details.error_records as API.CommitUserRecordError[];
      // Convert BackendUserListItem records to UserListItem
      const convertedErrorItems: API.CommitUserRecordError[] = rawErrorItems.map((errorItem) => ({
        ...errorItem,
        record: adaptBackendUserItemToFrontend(errorItem.record as API.BackendUserListItem),
      }));
      const errorItems = convertedErrorItems.filter(item => item.level === 'E' || item.level === 'W');
      const errorItemsWithIds = addIdsToErrorRecords(errorItems);
      setErrorResults(getUserErrors(errorItemsWithIds));
      messageApi.error(<FormattedMessage id="msg.error.insertFailed" />);
    }
  }

  const deleteRecordsInDataSource = async () => {
    try {
      const response = await deleteUserRecordArray(selectedDataSource);
      messageApi.success(<FormattedMessage id="msg.success.deleteSuccess" />);
      await getDataSource();

    } catch (e: any) {
      const rawErrorItems = e.response.data.error.details.error_records as API.CommitUserRecordError[];
      // Convert BackendUserListItem records to UserListItem
      const convertedErrorItems: API.CommitUserRecordError[] = rawErrorItems.map((errorItem) => ({
        ...errorItem,
        record: adaptBackendUserItemToFrontend(errorItem.record as API.BackendUserListItem),
      }));
      const errorItems = convertedErrorItems.filter(item => item.level === 'E' || item.level === 'W');
      const errorItemsWithIds = addIdsToErrorRecords(errorItems);
      setErrorResults(getUserErrors(errorItemsWithIds));
      messageApi.error(<FormattedMessage id="msg.error.insertFailed" />);
    }
  }

  const getUserErrors = (errorItems: API.CommitUserRecordError[]) => {
    const userErrorItems: API.CommitUserRecordError[] = [];
    const standardErrors = [
      { code: '0', msg:'msg.error.Exception'},
      { code: 'PG23505', msg:'msg.error.primaryKeyDuplicated'},
      { code: 'PG22001', msg:'msg.error.fieldWrongSize'},
    ]
    errorItems.forEach((errorItem) => {
      const record = editDataSource.find((element) => element.id == errorItem.record.id)
      const newErrorItem: API.CommitUserRecordError = {
        code: errorItem.code,
        detail: `${record?.name}, ${record?.lastname}, ${record?.age}, `,
        message: standardErrors[0].msg,
        record: errorItem.record,
        level: errorItem.level,
      }
      standardErrors.forEach((standardError) => {
        if(standardError.code == errorItem.code){
          newErrorItem.message = standardError.msg;
        }
      })
      userErrorItems.push(newErrorItem);
    })

    return userErrorItems;
  }

  useEffect(() => {
    getDataSource();
  },[])

  const downloadData = () => {
    if (dataSource.length === 0) return;

    const headerMapDownload: Record<string, string> = {
      name: '名前',
      lastname: '氏名',
      age: '年齢',
      country: '国籍',
      homeAddress: '住所',
    };

    const mappedData = dataSource.map((row: any) => {
      const newRow: Record<string, any> = {};
      Object.keys(headerMapDownload).forEach((key) => {
        const newKey = headerMapDownload[key as keyof typeof headerMapDownload];
        newRow[newKey] = row[key];
      });
      return newRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(mappedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, intl.formatMessage({ id: 'pages.userMaster.excelSheetName' }));
    XLSX.writeFile(workbook, intl.formatMessage({ id: 'pages.userMaster.excelFileName' }));
  }

  const uploadData = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

        const headerMapUpload: Record<string, string> = {
          '名前': 'name',
          '氏名': 'lastname',
          '年齢': 'age',
          '国籍': 'country',
          '住所': 'homeAddress',
        };

        const normalizedData = jsonData.map((row: any) => {
          const newRow: Record<string, any> = {};
          Object.keys(row).forEach((header) => {
            const key = headerMapUpload[header as keyof typeof headerMapUpload];
            if (key) {
              newRow[key] = row[header];
            }
          });
          return newRow;
        });

        await insertUserRecordArray(normalizedData);
        message.success(intl.formatMessage({ id: 'pages.userMaster.uploadSuccess' }));
        setTimeout(() => {
          actionRef.current?.reload?.();
        }, 1000);

      } catch (error) {
        message.error(intl.formatMessage({ id: 'pages.userMaster.uploadError' }));
      }

    };
    reader.readAsArrayBuffer(file);
    return false;
  }

  const handleSearch = ( confirm: FilterDropdownProps['confirm'], ) => { confirm(); };

  const handleReset = (clearFilters: () => void, confirm: FilterDropdownProps['confirm'],) => {
    clearFilters();
    confirm();
  };

  const getColumnSearchProps = (dataIndex: DataIndex): TableColumnType<DataType> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={intl.formatMessage({ id: 'pages.userMaster.searchPlaceholder' })}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(confirm)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters, confirm)}
            size="small"
            style={{ width: 90 }}
          >
            {intl.formatMessage({ id: 'pages.userMaster.clearButton' })}
          </Button>

          <Button
            type="primary"
            onClick={() => handleSearch(confirm)}
            size="small"
            style={{ width: 90 }}
          >
            {intl.formatMessage({ id: 'pages.userMaster.searchButton' })}
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    filterDropdownProps: {
      onOpenChange(open) {
        if (open) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },

  });

  const enableMultiUpdate = () => {
    setEditableRowKeys(dataSource?.map((item) => item.id));
    setEditDataSource([]);
    setIsInserting(false);
    setIsDeleting(false);
    setAllowEditPkFields(false);
    setIsEditing(true);
    setHideRowEditButton(true);
  }

  const enableMultiInsert = () => {
    setEditDataSource([]);
    setEditableRowKeys([]);
    setIsEditing(false);
    setIsDeleting(false);
    setIsInserting(true);
    setHideRowEditButton(true);
    setAllowEditPkFields(true);
  }

  const enableMultiDelete = () => {
    setEditDataSource([]);
    setEditableRowKeys([]);
    setIsEditing(false);
    setIsInserting(false);
    setAllowEditPkFields(false);
    setIsDeleting(true);
    setHideRowEditButton(true);
    setShowRowSelection(true);
  }

  const cancelMultipleUpdate = () => {
    formRef.current!.resetFields();
    setEditableRowKeys([]);
    setEditDataSource([]);
    setErrorResults([]);
    setSelectedRowKeys([]);
    setIsInserting(false);
    setIsEditing(false);
    setIsDeleting(false);
    setHideRowEditButton(false);
    setAllowEditPkFields(false);
    setShowRowSelection(false);
    refreshDataSource();
  }

  const addNewRecordRow = () => {
    const newRecord = {
      id: uuidv4(),
    };
    const dataSourceCopy = [...dataSource];
    dataSourceCopy.unshift(newRecord);
    setDataSource(dataSourceCopy);
    const editableKeysCopy = [...editableKeys];
    editableKeysCopy.unshift(newRecord.id);
    setEditableRowKeys(editableKeysCopy);
    formRef.current?.addEditRecord?.(newRecord);
  }

  const calculateStyleForm = (actualRecord: API.UserListItem, fieldName: string) => {
    let backgroundColor = 'white'
    let borderColor = undefined
    const recordFind = editDataSource.find((item) => item?.id == actualRecord?.id)
    if(recordFind){
      const originalRecord = dataSource.find((originalItem) => originalItem.id == actualRecord?.id)

      type UserKey = keyof API.UserListItem;
      if(originalRecord?.[fieldName as UserKey] !== recordFind?.[fieldName as UserKey]) {
        backgroundColor = '#fff7e6'
        borderColor = '#fa8c16'
      }
    }
    return {
      backgroundColor,
      borderColor
    }
  }

  const columns: ProColumns<API.UserListItem>[] = [
    {
      title: "",
      dataIndex: 'actions',
      search: false,
      render: (dom, entity) => {
        return (
          <UpdateForm key="create" userItem={entity} reload={actionRef.current?.reload} />
        );
      },
      editable: false,
      hideInTable: hideRowEditButton
    },
    {
      title: intl.formatMessage({ id: 'pages.userMaster.columnName' }),
      dataIndex: 'name',
      search: false,
      valueType: "text",
      sorter: (a, b) => {
        if(a.name! > b.name!) return 1
        else return -1
      },
      onCell: (record) => {
        const recordExist = errorResults.some(item => item?.record.id === record?.id);
        return { style: { backgroundColor: recordExist ? '#f7a968ff' : undefined, }, }
      },
      renderFormItem: (item, { record }) => {
        const {borderColor, backgroundColor} = calculateStyleForm(record!, 'name');
        return (
          <Input
            style={{
              background: backgroundColor,
              borderColor: borderColor,
            }}
          />
        );
      },
      ...getColumnSearchProps('name') as any,
    },
    {
      title: intl.formatMessage({ id: 'pages.userMaster.columnLastname' }),
      dataIndex: 'lastname',
      valueType: "text",
      search: false,
      sorter: (a, b) => {
        if(a.lastname! > b.lastname!) return 1
        else return -1
      },
      onCell: (record) => {
        const recordExist = errorResults.some(item => item?.record.id === record?.id);
        return { style: { backgroundColor: recordExist ? '#f7a968ff' : undefined, }, }
      },
      renderFormItem: (item, { record }) => {
        const {borderColor, backgroundColor} = calculateStyleForm(record!, 'lastname');
        return (
          <Input
            style={{
              background: backgroundColor,
              borderColor: borderColor,
            }}
          />
        );
      },
      ...getColumnSearchProps('lastname') as any,
    },
    {
      title: intl.formatMessage({ id: 'pages.userMaster.columnAge' }),
      dataIndex: 'age',
      valueType: 'digit',
      search: false,
      sorter: (a, b) => {
        if((a.age ?? 0) > (b.age ?? 0)) return 1
        else return -1
      },
      onCell: (record) => {
        const recordExist = errorResults.some(item => item?.record.id === record?.id);
        return { style: { backgroundColor: recordExist ? '#f7a968ff' : undefined, }, }
      },
      renderFormItem: (item, { record }) => {
        const {borderColor, backgroundColor} = calculateStyleForm(record!, 'age');
        return (
          <Input
            type="number"
            style={{
              background: backgroundColor,
              borderColor: borderColor,
            }}
          />
        );
      },
      ...getColumnSearchProps('age') as any,
    },
    {
      title: intl.formatMessage({ id: 'pages.userMaster.columnCountry' }),
      dataIndex: 'country',
      search: false,
      sorter: (a, b) => {
        const firstElement = a.country ?? '';
        const secondElement = b.country ?? '';
        return firstElement.localeCompare(secondElement, "ja", { sensitivity: 'variant'  });
      },
      onCell: (record) => {
        const recordExist = errorResults.some(item => item?.record.id === record?.id);
        return { style: { backgroundColor: recordExist ? '#f7a968ff' : undefined, }, }
      },
      renderFormItem: (item, { record }) => {
        const {borderColor, backgroundColor} = calculateStyleForm(record!, 'country');
        return (
          <Input
            style={{
              background: backgroundColor,
              borderColor: borderColor,
            }}
          />
        );
      },
      ...getColumnSearchProps('country') as any,
    },
    {
      title: intl.formatMessage({ id: 'pages.userMaster.columnHomeAddress' }),
      dataIndex: 'homeAddress',
      search: false,
      sorter: (a, b) => {
        const firstElement = a.homeAddress ?? '';
        const secondElement = b.homeAddress ?? '';
        return firstElement.localeCompare(secondElement, "ja", { sensitivity: 'variant'  });
      },
      onCell: (record) => {
        const recordExist = errorResults.some(item => item?.record.id === record?.id);
        return { style: { backgroundColor: recordExist ? '#f7a968ff' : undefined, }, }
      },
      renderFormItem: (item, { record }) => {
        const {borderColor, backgroundColor} = calculateStyleForm(record!, 'homeAddress');
        return (
          <Input
            style={{
              background: backgroundColor,
              borderColor: borderColor,
            }}
          />
        );
      },
      ...getColumnSearchProps('homeAddress') as any,
    },
    {
      title: "",
      dataIndex: 'searchKeyword',
      search: true,
      hideInTable: true,
      colSize: 2
    },

  ];

  return (
    <PageContainer title={false} breadcrumbRender={false}>
      {contextHolder}

      <PageContent noCustomer={false} noPeriod={false}>
        <div className="u_box">
          <PageTitle
            pageTitle="menu.search.user-master"
            pgId={"USER-001"}
          />
        </div>

        {errorResults.length > 0 && (
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
              {errorResults.map((item, index) => {
                  const message = item.message
                  return (
                    <li
                      key={index}
                      style={{
                        marginBottom: '4px',
                        color: item.level === 'E' ? '#ff4d4f' : '#fa8c16',
                        listStyleType: 'disc'
                      }}
                    >
                      <FormattedMessage id={message} values={{value: item.detail}} />

                    </li>
                  );
                })}
            </ul>
          </div>
        )}

        <EditableProTable<API.UserListItem, API.UserParams>
          headerTitle=""
          actionRef={actionRef}
          rowKey="id"
          size="small"
          search={{
            labelWidth: 120,
            resetText: intl.formatMessage({ id: 'pages.userMaster.clearButton' }),
            collapseRender:false,
            defaultCollapsed:false
          }}
          rowSelection={ showRowSelection ? {
            type: 'checkbox',
            selectedRowKeys,
            onChange: (selectedKeys) => {
              setSelectedRowKeys(selectedKeys);
              const newSelectedDataSource: any[] = [];
              selectedKeys.forEach((selectedKey) => {
                const record = dataSource.find((r) => r.id == selectedKey);
                if(record){
                  newSelectedDataSource.push(record);
                }
              })
              setSelectedDataSource(newSelectedDataSource)
            },
          } : undefined}
          request={async (params) => {
            return await refreshDataSource(params);
          }}
          toolBarRender={() => [
            (!isEditing && !isInserting && !isDeleting &&
              <Space size="small">
                <CreateForm key="create" reload={actionRef.current?.reload} />
                <Button onClick={downloadData}>{intl.formatMessage({ id: 'pages.userMaster.downloadButton' })}</Button>
                <Upload accept=".xlsx, .xls" beforeUpload={uploadData} showUploadList={false}>
                  <Button>{intl.formatMessage({ id: 'pages.userMaster.uploadButton' })}</Button>
                </Upload>
                <Button onClick={enableMultiUpdate}><FormattedMessage id="pages.userMaster.batchUpdatingButton"/></Button>
                <Button onClick={enableMultiInsert}><FormattedMessage id="pages.userMaster.batchInsertionButton"/></Button>
                <Button onClick={enableMultiDelete}><FormattedMessage id="pages.userMaster.batchDeleteButton"/></Button>
              </Space>
            ),
            (isEditing &&
              <Space size="small">
                <Button onClick={updateDataSource} type='primary'><FormattedMessage id="pages.userMaster.saveButton"/></Button>
                <Button onClick={cancelMultipleUpdate}><FormattedMessage id="pages.userMaster.cancelButton"/></Button>
              </Space>
            ),
            (isInserting &&
              <Space size="small">
                <Button onClick={saveNewRecordsOnDataSource} type='primary'><FormattedMessage id="pages.userMaster.saveButton"/></Button>
                <Button onClick={cancelMultipleUpdate}><FormattedMessage id="pages.userMaster.cancelButton"/></Button>
                <Button onClick={addNewRecordRow}><FormattedMessage id="pages.userMaster.addRecordButton"/></Button>
              </Space>
            ),
            (isDeleting &&
              <Space size="small">
                <Button onClick={deleteRecordsInDataSource} color="danger" variant="solid"><FormattedMessage id="pages.userMaster.deleteButton"/></Button>
                <Button onClick={cancelMultipleUpdate}><FormattedMessage id="pages.userMaster.cancelButton"/></Button>
              </Space>
            )

          ]}
          className='custom-toolbar'
          columns={columns}
          options={{ fullScreen: false,  reload :false, density: false, setting: false}}
          scroll={{ x: 'max-content' }}
          value={dataSource}
          pagination={{
            showSizeChanger: true,
            defaultPageSize: 10,
            pageSizeOptions: [10,20],
            showTotal: (total: number, range: [number, number]) => (
              <FormattedMessage
                id="table.showTotal"
                values={{ current: current, total: total, range0: range[0], range1: range[1] }}
              />
            ),
            total: total,
            current: current,
            onChange: (page) => {
              setCurrent(page);
            },
            position: ['bottomRight'],
          }}

          recordCreatorProps={false}

          editableFormRef={formRef}

          editable={{
            type: 'multiple',
            editableKeys,
            onValuesChange: (record, recordList) => {
              const editDataSourceIndex = editDataSource.findIndex((editRecord) => editRecord.id == record.id)

              const newEditDataSource = [...editDataSource];
              if (editDataSourceIndex !== -1){
                newEditDataSource[editDataSourceIndex] = record;
                setEditDataSource(newEditDataSource);
              } else {
                newEditDataSource.push(record);
                setEditDataSource(newEditDataSource);
              }
            },
            onChange: setEditableRowKeys,
          }}
        />
      </PageContent>
    </PageContainer>
  );
};

export default UserMaster;

