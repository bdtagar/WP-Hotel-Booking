(function ($) {

    var $doc = $(document);

    // set default option for datepicker
    $.datepicker.setDefaults({
        dateFormat: wphb_admin_js.date_time_format,
        monthNames: wphb_admin_js.monthNames,
        monthNamesShort: wphb_admin_js.monthNamesShort,
        dayNames: wphb_admin_js.dayNames,
        dayNamesShort: wphb_admin_js.dayNamesShort,
        dayNamesMin: wphb_admin_js.dayNamesMin,
        maxDate: '+365D'
    });

    var WPHB_Admin_Extra = {
        init: function () {
            var _self = this,
                _doc = $(document);

            // add new extra
            _doc.on('click', '.tp_extra_add_item', _self.add_new_extra)
            // delete extra
                .on('click', '.tp_extra_form_fields .remove_button', _self.remove_extra)
                // toggle extra
                .on('change', 'number_room_select', _self.toggle_extra);
        },
        add_new_extra: function (e) {
            e.preventDefault();
            var _current = $('.tp_extra_form_fields:last'),
                _new_extra = new Date().getTime(),
                _tmp = wp.template('tp-hb-extra-room');
            _tmp = _tmp({id: _new_extra});

            if (_current.length === 0) {
                $('.tp_extra_form_head').after(_tmp);
            } else {
                _current.after(_tmp);
            }
        },
        remove_extra: function (e) {
            e.preventDefault();

            if (!confirm(wphb_admin_js.confirm_remove_extra)) {
                return;
            }

            var _self = $(this),
                _package_id = _self.data('id'),
                _extra = _self.parents('.tp_extra_form_fields');

            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    package_id: _package_id,
                    action: 'wphb_admin_delete_extra_package'
                }
            }).done(function (res) {
                if (typeof res.status !== 'undefined' && res.status === 'success') {
                    _extra.remove();
                }
            });
        },
        toggle_extra: function (e) {
            e.preventDefault();

            var _self = $(this),
                _form = _self.parents('.hb-search-room-results'),
                _extra_area = _form.find('.hb_addition_package_extra'),
                _toggle = _extra_area.find('.hb_addition_packages'),
                _val = _self.val();

            if (_val !== '') {
                _form.parent().siblings().find('.hb_addition_packages').removeClass('active').slideUp();
                _toggle.removeAttr('style').addClass('active');
                _extra_area.removeAttr('style').slideDown();
            }
            else {
                _extra_area.slideUp();
                _val = 1;
            }

            _form.find('.hb_optional_quantity').val(_val);

        }
    };

    var WPHB_Admin_Booking = {
        init: function () {
            var _doc = $(document),
                _self = this;

            // add room item for booking
            _doc
            // .on('click', '#add_room_item', _self.init_add_room_modal)
            // date picker
                .on('click', '.checkin input.check_in_date, .checkout input.check_out_date', _self.datepicker)
                // time picker
                .on('click', '.checkin input.check_in_time, .checkout input.check_out_time', _self.timepicker)
                // edit booking room item
                // .on('click', '#booking-items .actions .edit', _self.edit_booking_room)
                // delete booking room item
                // .on('click', '#booking-items .actions .remove', _self.delete_booking_room)
                // check room available
                .on('wphb_check_room_available', _self.check_room_available)
                // enable add cart
                .on('wphb_enable_add_cart', _self.enable_add_cart)
                // toggle extra when click toggle button
                .on('click', '.hb_package_toggle', _self.toggle_extra)
                // handle modal open
                .on('wphb_modal_open', _self.modal_open_callback)
                // save add booking room item
                .on('wphb_submit_modal', _self.add_room_items);

            // load admin booking editor
            _self.load();

            // select customer in admin booking
            _self.select_booking_customer();

            // datepicker for filter booking by date
            _self.booking_date_filter();

        },

        load: function () {

            var _modal = $('#booking-modal-search');
            _modal.find('.checkin input.check_in_date, .checkout input.check_out_date').datepicker();
            _modal.find('.checkin input.check_in_time, .checkout input.check_out_time').timepicker({
                'timeFormat': 'H:i A',
                'step': '60'
            });
        },

        datepicker: function () {
            $(this).datepicker();
        },

        timepicker: function () {
            $(this).timepicker({
                'timeFormat': 'H:i A',
                'step': '60'
            });
        },


        init_add_room_modal: function (e) {
            e.preventDefault();
            var _self = $(this),
                _booking_id = _self.data('booking-id');
            _self.wphb_modal({
                tmpl: 'hb-add-room',
                settings: {
                    'order_id': _booking_id
                }
            });
            return false;
        },
        edit_booking_room: function (e) {
            e.preventDefault();
            var _self = $(this),
                _booking_id = _self.data('booking-id'),
                _booking_item_id = _self.data('booking-item-id'),
                _booking_item_type = _self.data('booking-item-type'),
                _icon = _self.find('.fa');

            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    booking_id: _booking_id,
                    booking_item_id: _booking_item_id,
                    booking_item_type: _booking_item_type,
                    action: 'wphb_admin_load_booking_item',
                    nonce: hotel_settings.nonce
                },
                beforeSend: function () {
                    _icon.addClass('fa-spin');
                }
            }).done(function (response) {
                _icon.removeClass('fa-spin');
                _self.wphb_modal({
                    tmpl: 'hb-add-room',
                    settings: response
                })
            });
        },
        delete_booking_room: function (e) {
            e.preventDefault();
            var _self = $(this),
                _booking_id = _self.data('booking-id'),
                _booking_item_id = _self.data('booking-item-id');

            _self.wphb_modal({
                tmpl: 'hb-confirm',
                settings: {
                    booking_id: _booking_id,
                    booking_item_id: _booking_item_id,
                    action: 'wphb_admin_remove_booking_item'
                }
            })

        },
        check_room_available: function (e, target, form) {
            e.preventDefault();
            e.stopPropagation();

            var _button = $('.form_footer .check_available'),
                _last_section = $('#hb_modal_dialog .section:last-child');

            _last_section.children().remove();

            form.push({
                name: 'action',
                value: 'wphb_admin_check_room_available'
            });

            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: form,
                beforeSend: function () {
                    _button.append('<i class="fa fa-spinner fa-spin"></i>');
                    $('select[name="qty"]').remove();
                }
            }).done(function (res) {
                _button.find('.fa').remove();
                if (typeof res.status === 'undefined') {
                    return;
                }
                if (res.status === false && typeof res.message !== 'undefined') {
                    alert(res.message);
                    return;
                }
                _last_section.append(wp.template('hb-qty')(res));
            });
        },
        enable_add_cart: function (e, target, form) {
            e.preventDefault();

            var _self = $('.number_room_select'),
                _form = _self.parents('.hb-search-room-results'),
                _extra_area = _form.find('.hb_addition_package_extra'),
                _toggle = _extra_area.find('.hb_addition_packages'),
                _val = _self.val(),
                _add_cart_button = _form.siblings('.form_footer').find('.button.form_submit');

            if (_val) {
                // toggle extra
                _form.parent().siblings().find('.hb_addition_packages').removeClass('active').slideUp();
                _toggle.removeAttr('style').addClass('active');
                _extra_area.removeAttr('style').slideDown();
                // enable add cart button
                _add_cart_button.prop('disabled', false);
            } else {
                alert('xxx');
                // toggle extra
                _extra_area.slideUp();
                // disable add cart button
                _add_cart_button.prop('disabled', true);
            }
        },
        toggle_extra: function (e) {
            e.preventDefault();

            var _self = $(this),
                _parent = _self.parents('.hb_addition_package_extra'),
                _toggle = _parent.find('.hb_addition_packages');

            _self.toggleClass('active');
            _toggle.toggleClass('active');

            if (_toggle.hasClass('active')) {
                _toggle.slideDown();
            } else {
                _toggle.slideUp();
            }
        },
        modal_open_callback: function (e, target, form) {
            e.preventDefault();
            if (target === 'hb-add-room') {
                var _check_in = form.find('.check_in_date'),
                    _check_out = form.find('.check_out_date'),
                    _select = form.find('.select-item');

                // select2
                _select.select2({
                    placeholder: wphb_admin_js.select_room,
                    minimumInputLength: 3,
                    // z-index: 10000,
                    ajax: {
                        url: ajaxurl,
                        dataType: 'json',
                        type: 'POST',
                        quietMillis: 50,
                        data: function (room) {
                            return {
                                room: room.term,
                                action: 'wphb_load_room_ajax',
                                nonce: hotel_settings.nonce
                            };
                        },
                        processResults: function (data) {
                            return {
                                results: $.map(data, function (item) {
                                    return {
                                        text: item.post_title,
                                        id: item.ID
                                    }
                                })
                            };
                        },
                        cache: true
                    }
                });

                // date picker
                _check_in.datepicker({
                    onSelect: function () {
                        var _self = $(this),
                            date = _self.datepicker('getDate'),
                            timestamp = new Date(date).getTime() / 1000 - (new Date().getTimezoneOffset() * 60);
                        _self.parent().find('input[name="check_in_date_timestamp"]').val(timestamp);

                        _check_out.datepicker('option', 'minDate', date);
                    }
                });
                _check_out.datepicker({
                    onSelect: function () {
                        var _self = $(this),
                            date = _self.datepicker('getDate'),
                            timestamp = new Date(date).getTime() / 1000 - (new Date().getTimezoneOffset() * 60);
                        _self.parent().find('input[name="check_out_date_timestamp"]').val(timestamp);

                        _check_in.datepicker('option', 'maxDate', date);
                    }
                });

            }
        },
        add_room_items: function (e, target, form) {
            var _form = $('#booking-details'),
                _inside = _form.parents('.inside'),
                _overlay = _form.find('.modal_overlay');

            form.push({
                name: 'action',
                value: 'wphb_admin_add_booking_item'
            });

            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: form,
                beforeSend: function () {
                    _overlay.addClass('active');
                }
            }).done(function (response) {
                _overlay.removeClass('active');
                if (typeof response.status !== 'undefined') {
                    if (true === response.status) {
                        _inside.html(response.html);
                    } else if (typeof  response.message !== 'undefined') {
                        alert(response.message);
                    }
                }
            });
        },
        select_booking_customer: function () {
            // $('#_hb_user_id').select2();
        },
        booking_date_filter: function () {
            $('#hb-booking-date-from').datepicker({
                onSelect: function () {
                    var _self = $(this),
                        date = _self.datepicker('getDate'),
                        timestamp = new Date(date).getTime() / 1000 - (new Date().getTimezoneOffset() * 60);
                    _self.parent().find('input[name="date-from-timestamp"]').val(timestamp);
                    $('#hb-booking-date-to').datepicker('option', 'minDate', date)
                }
            });
            $('#hb-booking-date-to').datepicker({
                onSelect: function () {
                    var _self = $(this),
                        date = _self.datepicker('getDate'),
                        timestamp = new Date(date).getTime() / 1000 - (new Date().getTimezoneOffset() * 60);
                    _self.parent().find('input[name="date-to-timestamp"]').val(timestamp);
                    $('#hb-booking-date-from').datepicker('option', 'maxDate', date)
                }
            });
            $('form#posts-filter').submit(function () {
                var counter = 0;
                $('#hb-booking-date-from, #hb-booking-date-to, select[name="filter-type"]').each(function () {
                    if ($(this).val()) counter++;
                });
                if (counter > 0 && counter < 3) {
                    alert(wphb_admin_js.filter_error);
                    return false;
                }
            });
        }
    };

    var WPHB_Admin_Pricing_Plan = {
        init: function () {
            var _self = this,
                _doc = $(document);

            // show room pricing plan
            _doc.on('change', '#hb-room-select', _self.show_room_pricing)
            // add new plan
                .on('click', '.add_new_plan', _self.add_new_plan)
                // remove plan
                .on('click', '.hb-pricing-controls a', _self.remove_plan)
                // update pricing plans
                .on('submit', 'form[name="pricing-table-form"]', _self.update_pricing)
                // update prcing
                .on('submit', 'form[name="hb-add-calendar-pricing"]', _self.add_calendar_pricing);


            // init pricing tables
            _self.init_pricing_tables();

            // pricing calendar
            _self.init_pricing_calendar();

            // view next/previous pricing calendar
            _doc.on('click', '.hotel-booking-fullcalendar .fc-header-toolbar .fc-button-group', _self.calendar_actions);
        },

        add_calendar_pricing: function (e) {
            e.preventDefault();
            var _self = $(this),
                _data = _self.serializeArray();

            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'wphb_admin_add_calendar_pricing',
                    nonce: hotel_settings.nonce,
                    data: _data
                }
            }).done(function (res) {
                location.reload();
            });
        },

        show_room_pricing: function (e) {
            e.preventDefault();
            var _self = this,
                _location = window.location.href;
            _location = _location.replace(/[&]?hb-room=[0-9]+/, '');
            if (_self.value !== 0) {
                _location += '&hb-room=' + _self.value;
            }
            window.location.href = _location;
        },
        add_new_plan: function (e) {
            e.preventDefault();
            var _self = this,
                _button = $('.add_new_plan'),
                _table = _button.parent().siblings('.hb-pricing-table'),
                _cloned = $(wp.template('hb-pricing-table')()),
                _inputs = _cloned.find('.hb-pricing-price');

            WPHB_Admin_Pricing_Plan.init_pricing_plan(_cloned);

            _table.find('.hb-pricing-price').each(function (i) {
                var _price = this;
                _inputs.eq(i).val(_price.value);
            });
            if (_table.hasClass('regular-price')) {
                _cloned.removeClass('regular-price');
                $('#hb-pricing-plan-list').append(_cloned);
            } else {
                _cloned.insertAfter(_table);
            }
            $('#hb-no-plan-message').hide();
        },
        remove_plan: function (e) {
            e.preventDefault();
            var _self = this,
                _table = _self.closest('.hb-pricing-table');

            if (confirm(wphb_admin_js.confirm_remove_pricing_table)) {
                if (_table.length === 0) {
                    $('#hb-no-plan-message').show();
                }
                _table.remove();
            }
        },
        update_pricing: function () {
            var _table = $('.hb-pricing-table');

            _table.each(function (i) {
                var _start = _table.find('input[name^="date-start"]'),
                    _end = _table.find('input[name^="date-end"]');
                if (!_table.hasClass('regular-price')) {

                    if (!isDate(_start.datepicker('getDate'))) {
                        alert(wphb_admin_js.empty_pricing_plan_start_date);
                        _start.focus();
                        return;
                    } else if (!isDate(_end.datepicker('getDate'))) {
                        alert(wphb_admin_js.empty_pricing_plan_end_date);
                        _end.focus();
                        return;
                    }
                }
                _table.find('input[type="text"], input[type="number"], input[type="hidden"]').each(function () {
                    var _input = $(this),
                        _name = _input.attr('name');
                    _name = _name.replace(/__INDEX__/, i - 1000);
                    _input.attr('name', _name);
                });
            });
        },
        init_pricing_tables: function () {
            var _table = $('.hb-pricing-table');

            _table.each(function () {
                WPHB_Admin_Pricing_Plan.init_pricing_plan(_table);
            })
        },
        init_pricing_calendar: function () {
            var _full_calendar = $('.hotel-booking-fullcalendar');

            for (var i = 0; i < _full_calendar.length; i++) {
                var _calendar = $(_full_calendar[i]),
                    _events = _calendar.data('events');

                if (typeof _events === 'undefined') {
                    _events = [];
                }

                _calendar.fullCalendar({
                    height: 400,
                    selectable: true,
                    events: _events,
                    eventAfterRender: function (event, element, view) {
                        $(element).css({
                            'width': '50px',
                            'border-radius': '0',
                            'padding': '10px',
                            'text-align': 'center',
                            'font-size': '11px',
                            'margin': '0 auto'
                        });
                    },
                    select: function (startDate, endDate) {
                        var _self = $(this),
                            _doc = $(document),
                            _calendar = $('.hotel-booking-fullcalendar'),
                            _name = _calendar.data('room-name'),
                            _id = _calendar.data('room-id'),
                            _target = 'hb-update-pricing-form',
                            _lightbox = '#update_pricing_popup';

                        $(_lightbox).html(wp.template(_target)({
                            name: _name,
                            id: _id,
                            from: startDate.format(),
                            to: endDate.format()
                        }));
                        $.magnificPopup.open({
                            type: 'inline',
                            items: {src: _lightbox}
                        });
                        return false;
                    }
                });
            }
        },
        calendar_actions: function (e) {
            e.preventDefault();
            var _self = this,
                _calendar = $('.hotel-booking-fullcalendar'),
                _calendar_month = $('.hotel-booking-fullcalendar-month'),
                _calendar_next = $('.hotel-booking-fullcalendar-toolbar .fc-next-button'),
                _calendar_pre = $('.hotel-booking-fullcalendar-toolbar .fc-prev-button'),
                _room_id = _self.data('room'),
                _month = _self.data('month'),
                _date = new Date(),
                _init_date = [];

            _init_date.push(_date.getYear() + '-' + _date.getMonth());

            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'wphb_admin_load_pricing_calendar',
                    nonce: hotel_settings.nonce,
                    room_id: _room_id,
                    month: _month
                },
                beforeSend: function () {
                    _self.append('<i class="fa fa-spinner fa-spin"></i>');
                }
            }).done(function (res) {
                _self.find('.fa').remove();
                if (res.status === true) {

                    var _events = JSON.parse(res.events),
                        _date = new Date(_events[0].start),
                        _month = _date.getYear() + '-' + _date.getMonth();

                    if (_init_date.indexOf(_month) === -1) {
                        _init_date.push(_month);
                        for (var i = 0; i < _events.length; i++) {
                            var _event = _events[i];
                            _calendar.fullCalendar('renderEvent', _event, true);
                        }
                    }

                    _calendar.fullCalendar('refetchEvents');

                    if (_self.hasClass('fc-next-button')) {
                        _calendar.fullCalendar('next');
                    } else {
                        _calendar.fullCalendar('prev');
                    }

                    _calendar_month.text(res.month_name);
                    _calendar_next.attr('data-month', res.next);
                    _calendar_pre.attr('data-month', res.prev);
                }

            }).fail(function () {
                _self.find('.fa').remove();
            });
        },
        init_pricing_plan: function (_plan) {
            _plan.find('.datepicker').datepicker({
                onSelect: function () {
                    var _self = $(this),
                        _date = _self.datepicker('getDate'),
                        _timestamp = new Date(_date).getTime() / 1000 - (new Date(_date).getTimezoneOffset() * 60),
                        _name = _self.attr('name');
                    var _hidden_name = false;
                    if (_name.indexOf('date-start') === 0) {
                        _hidden_name = _name.replace('date-start', 'date-start-timestamp');
                    } else if (_name.indexOf('date-end') === 0) {
                        _hidden_name = _name.replace('date-end', 'date-end-timestamp');
                    }
                    if (_hidden_name) {
                        _plan.find('input[name="' + _hidden_name + '"]').val(_timestamp);
                    }
                }
            });
        }
    };

    var WPHB_Admin_Settings = {
        init: function () {
            var _doc = $(document),
                _self = this;

            // select images
            _doc.on('click', '.room-gallery-input .attachment.add-new', _self.add_image_selector)
            // remove images
                .on('click', '.room-gallery-input .attachment .dashicons-trash', _self.remove_image_selector)
                // dismiss notice
                .on('click', '.hb-dismiss-notice button', _self.dismiss_notice)
                // admin add-on tabs
                .on('click', '#wphb-admin-addons-wrapper .nav-tab-wrapper a.nav-tab', _self.admin_addon_tabs)
                // filter override templates
                .on('click', '#wphb-theme-override-templates .template-filter', _self.filter_override_templates)
                // admin click rating plugin
                .on('click', '.wphb-rating-star', _self.click_rating_plugin)
                // check missing table
                .on('click', '#check_db_status', _self.check_db_status)
                // developer access
                .on('click', '.copy-developer-access-link', _self.copy_developer_access_link)
                // customer submit feedback form
                .on('submit', 'form[name="wphb-customer-feedback-form"]', _self.submit_customer_feedback_form);
            // datetime picker field
            _self.datetime_metabox_field();
            // set select2 for fields
            _self.admin_select2();
            // sort images
            _self.images_sortable();

            $('#wphb-advertisement').WPHB_Advertisement_Slider();

        },
        add_image_selector: function (e) {
            e.preventDefault();
            var _self = $(this),
                _file_frame = wp.media.frames.file_frame = wp.media({multiple: true});

            _file_frame.on('select', function () {
                var _attachments = _file_frame.state().get('selection').toJSON();
                var _html = '';

                for (var i = 0; i < _attachments.length; i++) {
                    var _attachment = _attachments[i];
                    _html += '<li class="attachment">';
                    _html += '<div class="attachment-preview">';
                    _html += '<div class="thumbnail">';
                    _html += '<div class="centered">';
                    _html += '<img src="' + _attachment.url + '"/>';
                    _html += '<input type="hidden" name="_hb_gallery[]" value="' + _attachment.id + '" />'
                    _html += '</div>';
                    _html += '</div>';
                    _html += '</div>';
                    _html += '<a class="dashicons dashicons-trash" title="' + wphb_admin_js.remove_image + '"></a>';
                    _html += '</li>';
                }
                _self.before(_html);
            });
            _file_frame.open();
        },
        remove_image_selector: function (e) {
            e.preventDefault();
            var _self = $(this);

            _self.parent().remove();
        },
        datetime_metabox_field: function () {
            $(".datetime-picker-metabox").datepicker({
                minDate: 0,
                numberOfMonths: 2,
                onSelect: function (selected) {
                    var _self = $(this),
                        _name = _self.attr('name'),
                        _date = _self.datepicker('getDate'),
                        _timestamp = new Date(_date).getTime() / 1000 - (new Date().getTimezoneOffset() * 60);
                    if (_date) {
                        _date.setDate(_date.getDate() + 1);
                    }
                    $('input[name="' + _name + '_timestamp"]').val(_timestamp);
                }
            });
        },
        admin_select2: function () {
            // select setting page
            // $('form[name="hb-admin-settings-form"] select').select2();
            // select country
            $('select[name="_hb_customer_country"]').select2();
            // select metabox
            $('.hb-form-field .hb-form-field-input select[name="_hb_room_extra[]"]').select2({
                placeholder: wphb_admin_js.select_extra_placeholder,
                width: '50%'
            });
        },
        images_sortable: function () {
            var _gallery = $('.room-gallery-input'),
                _images = _gallery.find('ul');

            _images.sortable();
        },
        dismiss_notice: function (e) {
            e.preventDefault();
            var _self = this,
                _parent = _self.closest('.hb-dismiss-notice');
            if (_parent.length) {
                $.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'wphb_admin_dismiss_notice'
                    }
                })
            }
        },
        admin_setting_tabs: function (e) {
            e.preventDefault();
            var _self = $(this),
                _tabs = $('.nav-tab-wrapper a.nav-tab'),
                _tab = _self.data('tab');

            _tabs.removeClass('nav-tab-active');
            _self.addClass('nav-tab-active');
            $('form[name="hb-admin-settings-form"]').hide();
            $('#settings-' + _tab).show();

            var _content = $('#settings-' + _tab + ' .admin-setting-section-content');

            if (_content.hasClass('general-section')) {
                _content.css('display', 'block');
            } else {
                // _content.first().css('background', 'red');
            }
        },
        admin_setting_sub_tabs: function (e) {
            e.preventDefault();
            var _self = $(this),
                _sub_tabs = $('.hb-admin-sub-tab.subsubsub li a'),
                _sub_tab = _self.data('subtab');

            _sub_tabs.removeClass('current');
            _self.addClass('current');
            $('.admin-setting-section-content').hide();
            $('.admin-setting-section-content.' + _sub_tab).fadeIn();
        },
        admin_addon_tabs: function (e) {
            e.preventDefault();
            var _self = $(this),
                _tabs = $('.nav-tab-wrapper a.nav-tab'),
                _tab = _self.data('tab');

            _tabs.removeClass('nav-tab-active');
            _self.addClass('nav-tab-active');
            $('.admin-addons-tab-content').hide();
            $('#addons-' + _tab).show();
        },
        filter_override_templates: function (e) {
            var $link = $(this),
                template = $link.data('template'),
                filter = $link.data('filter');
            if ($link.hasClass('current')) {
                return false;
            }
            $link.addClass('current').siblings('a').removeClass('current');
            var $templatesList = $('#wphb-theme-override-templates'),
                $templates = $templatesList.find('tr[data-template]');

            if (!template) {
                if (!filter) {
                    $templates.removeClass('hide-if-js');
                } else {
                    $templates.map(function () {
                        $(this).toggleClass('hide-if-js', $(this).data('filter-' + filter) !== 'yes');
                    })
                }
            } else {
                $templates.map(function () {
                    $(this).toggleClass('hide-if-js', $(this).data('template') !== template);
                })
            }

            $('.no-templates').toggleClass('hide-if-js', !!$templatesList.find('tr.template-row:not(.hide-if-js):first').length);
            return false;
        },
        click_rating_plugin: function () {
            $('#footer-left').hide();
            $.ajax({
                url: ajaxurl,
                data: {
                    action: 'wphb_admin_rating_plugin'
                }
            });
        },
        check_db_status: function (e) {
            e.preventDefault();

            $.ajax({
                url: ajaxurl,
                data: {
                    action: 'wphb_admin_force_update_db'
                }
            });
        },
        copy_developer_access_link: function (e) {
            e.preventDefault();
            $('#wpbh-link-developer-access').select();
            document.execCommand("copy");
        },

        submit_customer_feedback_form: function (e) {
            e.preventDefault();

            var _self = $(this),
                _data = _self.serialize();

            $.ajax({
                url: ajaxurl,
                data: {
                    action: 'wphb_admin_send_feedback',
                    data: _data
                }
            });
        }
    };

    function _ready() {
        WPHB_Admin_Booking.init();

        WPHB_Admin_Extra.init();

        WPHB_Admin_Pricing_Plan.init();

        WPHB_Admin_Settings.init();

        $('.post-type-hb_room.taxonomy-hb_room_capacity .bulkactions').append('<button type="button" class="button button-primary hb-update-ordering">Update</button>');
        $doc.on('click', '.hb-update-ordering', function () {
            $(this.form).append('<input type="hidden" name="action" value="hb-update-taxonomy" />').submit();
        });
    }

    $doc.ready(_ready);

})(jQuery);

/**
 * Create admin modal
 */
(function ($, Backbone, _) {

    var _doc = $(document);

    $.fn.wphb_modal = function (options) {
        var modal_options = $.extend({}, {
            tmpl: '',
            settings: {}
        }, options);

        if (modal_options.tmpl) {
            WPHB_Modal.view(modal_options.tmpl, modal_options.settings);
        }
    };

    var WPHB_Modal = {
        view: function (target, options) {
            var view = Backbone.View.extend({
                id: 'hb_modal_dialog',
                options: options,
                target: target,
                events: {
                    'click .modal_close': 'close_modal',
                    'click .modal_overlay': 'close_modal',
                    'click .form_submit': 'submit_modal',
                    'change .number_room_select': 'enable_add_item',
                    'click .check_room_available': 'check_room_available'
                },
                // construct function
                initialize: function (data) {
                    this.render();
                },
                render: function () {
                    var _template = wp.template(this.target);

                    _template = _template(this.options);

                    $('body').append(this.$el.html(_template));

                    var _content = $('.hb_modal'),
                        _width = _content.outerWidth(),
                        _height = _content.outerHeight();

                    _content.css({'margin-top': '-' + _height / 2 + 'px', 'margin-left': '-' + _width / 2 + 'px'});

                    _doc.trigger('wphb_modal_open', [this.target, _content.find('form')]);
                },
                submit_modal: function () {
                    _doc.trigger('wphb_submit_modal', [this.target, this.modal_data()]);

                    this.close_modal();

                    return false;
                },
                close_modal: function () {
                    _doc.trigger('wphb_close_modal', [this.target, this.modal_data()]);

                    this.$el.remove();

                    return false;
                },
                check_room_available: function () {
                    _doc.trigger('wphb_check_room_available', [this.target, this.modal_data()]);

                    return false;
                },
                enable_add_item: function () {
                    _doc.trigger('wphb_enable_add_cart', [this.target, this.modal_data()]);

                    return false;
                },
                modal_data: function () {
                    return $(this.$el).find('form:first-child').serializeArray();
                }
            });

            return new view(options);
        }
    }
})(jQuery, Backbone, _);

(function ($) {
    function WPHB_Advertisement_Slider(el, options) {
        this.options = $.extend({}, options || {});
        var $el = $(el),
            $items = $el.find('.slide-item'),
            $controls = $('<div class="slider-controls"><div class="next-item"></div><div class="prev-item"></div></div>'),
            $wrapItems = $('<div class="slider-items"></div>').append($items),
            itemIndex = 0;

        function init() {
            createHTML();
            bindEvents();
            activeItem();
        }

        function createHTML() {
            $el.append($wrapItems).append($controls);
        }

        function activeItem(index) {
            index = index !== undefined ? index : itemIndex;
            $items.eq(index).addClass('slide-active').siblings().removeClass('slide-active');
        }

        function nextItem() {
            if (itemIndex < $items.length - 1) {
                itemIndex++;
            } else {
                itemIndex = 0;
            }
            activeItem(itemIndex);
        }

        function prevItem() {
            if (itemIndex > 0) {
                itemIndex--;
            } else {
                itemIndex = $items.length - 1;
            }
            activeItem(itemIndex);
        }

        function bindEvents() {
            $el.on('click', '.next-item', nextItem);
            $el.on('click', '.prev-item', prevItem);
        }

        init();
    }

    $.fn.WPHB_Advertisement_Slider = function (opts) {
        return $.each(this, function () {
            var $slider = $(this).data('WPHB_Advertisement_Slider');
            if (!$slider) {
                $slider = new WPHB_Advertisement_Slider(this, opts);
                $(this).data('WPHB_Advertisement_Slider', $slider);
            }
            return this;
        })
    };
})(jQuery);




