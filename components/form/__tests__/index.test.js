import React from 'react';
import { mount } from 'enzyme';
import scrollIntoView from 'dom-scroll-into-view';
import Form from '..';
import Input from '../../input';
import Button from '../../button';

jest.mock('dom-scroll-into-view');

const delay = () =>
  new Promise(resolve => {
    setTimeout(resolve, 0);
  });

describe('Form', () => {
  scrollIntoView.mockImplementation(() => {});
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  async function change(wrapper, index, value) {
    wrapper
      .find(Input)
      .at(index)
      .simulate('change', { target: { value } });
    await delay();
    wrapper.update();
  }

  beforeEach(() => {
    scrollIntoView.mockReset();
  });

  afterEach(() => {
    errorSpy.mockReset();
  });

  afterAll(() => {
    errorSpy.mockRestore();
    scrollIntoView.mockRestore();
  });

  describe('List', () => {
    function testList(name, renderField) {
      it(name, async () => {
        const wrapper = mount(
          <Form>
            <Form.List name="list">
              {(fields, { add, remove }) => (
                <React.Fragment>
                  {fields.map(field => renderField(field))}
                  <Button className="add" onClick={add}>
                    Add
                  </Button>
                  <Button
                    className="remove"
                    onClick={() => {
                      remove(1);
                    }}
                  >
                    Remove
                  </Button>
                </React.Fragment>
              )}
            </Form.List>
          </Form>,
        );

        async function operate(className) {
          wrapper
            .find(className)
            .last()
            .simulate('click');
          await delay();
          wrapper.update();
        }

        await operate('.add');
        expect(wrapper.find(Input).length).toBe(1);

        await operate('.add');
        expect(wrapper.find(Input).length).toBe(2);

        await change(wrapper, 1, '');
        expect(wrapper.find('.ant-form-item-explain').length).toBe(1);

        await operate('.remove');
        expect(wrapper.find(Input).length).toBe(1);
        expect(wrapper.find('.ant-form-item-explain').length).toBe(0);
      });
    }

    testList('operation correctly', field => (
      <Form.Item {...field} rules={[{ required: true }]}>
        <Input />
      </Form.Item>
    ));

    testList('nest noStyle', field => (
      <Form.Item key={field.key}>
        <Form.Item noStyle {...field} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Form.Item>
    ));
  });

  it('noStyle Form.Item', async () => {
    const onChange = jest.fn();

    const wrapper = mount(
      <Form>
        <Form.Item>
          <Form.Item name="test" rules={[{ required: true }]}>
            <Input onChange={onChange} />
          </Form.Item>
        </Form.Item>
      </Form>,
    );

    await change(wrapper, 0, '');
    expect(wrapper.find('.ant-form-item-explain').length).toBe(1);

    expect(onChange).toHaveBeenCalled();
  });

  it('`shouldUpdate` should work with render props', () => {
    mount(
      <Form>
        <Form.Item>{() => null}</Form.Item>
      </Form>,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      'Warning: [antd: Form.Item] `children` of render props only work with `shouldUpdate`.',
    );
  });

  describe('scrollToField', () => {
    function test(name, genForm) {
      it(name, () => {
        let callGetForm;

        const Demo = () => {
          const { props, getForm } = genForm();
          callGetForm = getForm;

          return (
            <Form name="scroll" {...props}>
              <Form.Item name="test">
                <Input />
              </Form.Item>
            </Form>
          );
        };

        mount(<Demo />, { attachTo: document.body });

        expect(scrollIntoView).not.toHaveBeenCalled();
        callGetForm().scrollToField('test');
        expect(scrollIntoView).toHaveBeenCalled();
      });
    }

    // hooks
    test('useForm', () => {
      const [form] = Form.useForm();
      return {
        props: { form },
        getForm: () => form,
      };
    });

    // ref
    test('ref', () => {
      let form;
      return {
        props: {
          ref: instance => {
            form = instance;
          },
        },
        getForm: () => form,
      };
    });
  });
});
