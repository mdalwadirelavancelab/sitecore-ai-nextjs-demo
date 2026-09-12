import { JSX } from 'react';
import { Link as ContentSdkLink, Text, LinkField, TextField, ComponentParams, ComponentRendering, } from '@sitecore-content-sdk/nextjs';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';

/**
 * GraphQL field typing (same as SXA LinkList)
 */
type ResultsFieldLink = {
  field: {
    link: LinkField;
  };
};

interface Fields {
  data: {
    datasource: {
      children: {
        results: ResultsFieldLink[];
      };
      field: {
        title: TextField;
      };
    };
  };
}

interface DsiLinkListComponentProps {
  rendering: ComponentRendering & { params: ComponentParams };
  params: ComponentParams;
  fields: Fields;
}

/**
 * Single Link List Item
 */
type LinkListItemProps = {
  index: number;
  total: number;
  field: LinkField;
};

const DsiLinkListItem = ({ index, total, field }: LinkListItemProps) => {
  let className = `item${index}`;
  className += (index + 1) % 2 === 0 ? ' even' : ' odd';

  if (index === 0) className += ' first';
  if (index + 1 === total) className += ' last';

  return (
    <li className={className}>
      <div className="field-link">
        <ContentSdkLink field={field} />
      </div>
    </li>
  );
};

/**
 * Default rendering
 */
export const Default = (props: DsiLinkListComponentProps): JSX.Element => {
  const datasource = props.fields?.data?.datasource;
  // console.log('DsiLinkListComponent props:', props);
  // console.log('DsiLinkListComponent datasource:', datasource);
  // const id = props.params?.RenderingIdentifier;
  // const styles = `component dsi-link-list ${props.params?.styles || ''}`.trim();
  const { id, styles: baseStyles } = getComponentStyles(props.params);
  const styles = `component dsi-link-list ${baseStyles}`.trim();

  if (!datasource) {
    return (
      <div className={styles} id={id || undefined}>
        <div className="component-content">
          <h3>Dsi Link List</h3>
        </div>
      </div>
    );
  }

  const items = datasource.children.results
    .filter((item) => item?.field?.link)
    .map((item, index) => (
      <DsiLinkListItem
        key={index}
        index={index}
        total={datasource.children.results.length}
        field={item.field.link}
      />
    ));

  return (
    <div className={styles} id={id || undefined}>
      <div className="component-content">
        <Text tag="h3" field={datasource.field.title} />
        <ul>{items}</ul>
      </div>
    </div>
  );
};



// import { JSX } from 'react';
// import { ComponentParams, ComponentRendering } from '@sitecore-content-sdk/nextjs';

// interface DsiLinkListComponentProps {
//   rendering: ComponentRendering & { params: ComponentParams };
//   params: ComponentParams;
// }

// export const Default = (props: DsiLinkListComponentProps): JSX.Element => {
//   const id = props.params.RenderingIdentifier;

//   return (
//     <div className={`component ${props.params.styles}`} id={id ? id : undefined}>
//       <div className="component-content">
//         <p>DsiLinkListComponent Component</p>
//       </div>
//     </div>
//   );
// };
